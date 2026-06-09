import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { dbQueryAll, dbQueryGet, dbRun, VAULT_EXTERNAL_ROOT } from '../utils/db';

const router = Router();

/**
 * 1. Self-contained Content Search API
 * GET /api/vault/contents
 * 
 * Supports query parameters:
 * - source_type: filter by radar, rss, youtube, github
 * - status: filter by scraped, ready_for_design, designed, posted, archived
 * - keyword: text search across title, selected_headline, raw_content
 * - min_rating: minimum news or evergreen rating
 * - sort_by: sorting by 'newest' (created_at DESC) or 'score' (highest rating_news or rating_evergreen DESC)
 */
router.get('/contents', async (req: Request, res: Response) => {
  try {
    const { source_type, status, keyword, min_rating, sort_by } = req.query;

    let sql = 'SELECT * FROM vault_contents WHERE 1=1';
    const params: any[] = [];

    if (source_type) {
      sql += ' AND source_type = ?';
      params.push(source_type as string);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status as string);
    }

    if (keyword) {
      sql += ' AND (title LIKE ? OR selected_headline LIKE ? OR raw_content LIKE ?)';
      const searchStr = `%${keyword}%`;
      params.push(searchStr, searchStr, searchStr);
    }

    if (min_rating) {
      sql += ' AND (rating_news >= ? OR rating_evergreen >= ?)';
      const ratingVal = Number(min_rating);
      params.push(ratingVal, ratingVal);
    }

    // Sorting
    if (sort_by === 'newest') {
      sql += ' ORDER BY created_at DESC';
    } else if (sort_by === 'score') {
      sql += ' ORDER BY MAX(rating_news, rating_evergreen) DESC';
    } else {
      // Default sort
      sql += ' ORDER BY created_at DESC';
    }

    const rows = await dbQueryAll(sql, params);

    // Format metadata and media_paths from JSON strings to parsed objects
    const formatted = rows.map((row: any) => {
      let metadata = {};
      let mediaPaths = [];

      try {
        if (row.metadata_json) {
          metadata = JSON.parse(row.metadata_json);
        }
      } catch (err) {
        console.warn(`Failed to parse metadata_json for content ID: ${row.id}`, err);
      }

      try {
        if (row.media_paths_json) {
          mediaPaths = JSON.parse(row.media_paths_json);
        }
      } catch (err) {
        console.warn(`Failed to parse media_paths_json for content ID: ${row.id}`, err);
      }

      return {
        ...row,
        metadata,
        media_paths: mediaPaths
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error: any) {
    console.error('[ERROR] Content search failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 2. Content Status Lifecycle and Headline Updater
 * POST /api/vault/contents/:id/status
 * 
 * Request body keys:
 * - status: transition state (scraped, ready_for_design, designed, posted, archived)
 * - selected_headline: optional Thai post headline text
 */
router.post('/contents/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, selected_headline, rating_news, rating_evergreen } = req.body;
    const now = new Date().toISOString();

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุสเตตัสความคืบหน้า (status is required)'
      });
    }

    let sql = 'UPDATE vault_contents SET status = ?, updated_at = ?';
    const params: any[] = [status, now];

    if (selected_headline !== undefined) {
      sql += ', selected_headline = ?';
      params.push(selected_headline);
    }

    if (rating_news !== undefined) {
      sql += ', rating_news = ?';
      params.push(Number(rating_news));
    }

    if (rating_evergreen !== undefined) {
      sql += ', rating_evergreen = ?';
      params.push(Number(rating_evergreen));
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const result = await dbRun(sql, params);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบ ID ชิ้นคอนเทนต์ที่กำหนด (Content ID not found)'
      });
    }

    console.log(`[SUCCESS] Updated content state: ${id} -> ${status}`);
    return res.json({
      success: true,
      message: 'อัปเดตสถานะชิ้นคอนเทนต์เรียบร้อยแล้ว'
    });
  } catch (error: any) {
    console.error('[ERROR] Content status update failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 2.3. Batch Update Status of Content IDs
 * POST /api/vault/contents/batch-status
 */
router.post('/contents/batch-status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุรายการ ID ชิ้นคอนเทนต์ (ids array is required)'
      });
    }
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุสถานะ (status is required)'
      });
    }

    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE vault_contents SET status = ?, updated_at = ? WHERE id IN (${placeholders})`;
    const params = [status, now, ...ids];

    const result = await dbRun(sql, params);

    console.log(`[SUCCESS] Batch updated status to ${status} for ${result.changes} items`);
    return res.json({
      success: true,
      message: `อัปเดตสถานะจำนวน ${result.changes} ไอเทมเรียบร้อยแล้ว`,
      changes: result.changes
    });
  } catch (error: any) {
    console.error('[ERROR] Batch status update failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 2.4. Batch Delete Content IDs
 * POST /api/vault/contents/batch-delete
 */
router.post('/contents/batch-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุรายการ ID ชิ้นคอนเทนต์ (ids array is required)'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    
    // Delete linked graphics first
    await dbRun(`DELETE FROM generated_graphics WHERE content_id IN (${placeholders})`, ids);
    
    // Delete content items
    const result = await dbRun(`DELETE FROM vault_contents WHERE id IN (${placeholders})`, ids);

    console.log(`[SUCCESS] Batch deleted ${result.changes} items`);
    return res.json({
      success: true,
      message: `ลบไอเทมจำนวน ${result.changes} ไอเทมเรียบร้อยแล้ว`,
      changes: result.changes
    });
  } catch (error: any) {
    console.error('[ERROR] Batch delete failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 2.4.1. Retrieve All Generated Graphics
 * GET /api/vault/graphics
 */
router.get('/graphics', async (req: Request, res: Response) => {
  try {
    const rows = await dbQueryAll('SELECT * FROM generated_graphics ORDER BY created_at DESC');
    return res.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('[ERROR] Fetching all graphics failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 2.5. Retrieve Generated Graphics for a Content ID
 * GET /api/vault/contents/:id/graphics
 */
router.get('/contents/:id/graphics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await dbQueryAll('SELECT * FROM generated_graphics WHERE content_id = ? ORDER BY created_at DESC', [id]);
    return res.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('[ERROR] Fetching generated graphics failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 3. Safe External Media Server with Anti-Path Traversal Checks
 * GET /api/vault/media
 * 
 * Query parameters:
 * - path: relative path to the image/media under VAULT_EXTERNAL_ROOT
 */
router.get('/media', (req: Request, res: Response) => {
  const fileRelativePath = req.query.path as string;

  if (!fileRelativePath) {
    return res.status(400).json({ error: 'กรุณาระบุ Path ของรูปภาพ (path query parameter is required)' });
  }

  // 1. Block directory traversal tricks
  if (
    fileRelativePath.includes('..') ||
    fileRelativePath.includes('%2e%2e') ||
    fileRelativePath.includes('\\..') ||
    fileRelativePath.includes('../')
  ) {
    return res.status(403).json({ error: '403 Forbidden: ห้ามเข้าถึงนอกพื้นที่เก็บความมั่นคง' });
  }

  // 2. Perform path normalization and resolve against the vault root
  const safePath = path.normalize(fileRelativePath).replace(/^(\.\.(\/|\\))+/, '');
  const absoluteFilePath = path.resolve(VAULT_EXTERNAL_ROOT, safePath);

  // 3. Double-check that absolute path is strictly within VAULT_EXTERNAL_ROOT directory
  if (!absoluteFilePath.startsWith(VAULT_EXTERNAL_ROOT)) {
    return res.status(403).json({ error: '403 Forbidden: ห้ามเข้าถึงนอกพื้นที่เก็บความมั่นคง' });
  }

  // 4. Verify file existence and stream the asset back safely
  fs.access(absoluteFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'ไม่พบไฟล์ภาพประกอบที่ต้องการ (File not found)' });
    }
    return res.sendFile(absoluteFilePath);
  });
});

/**
 * 4. Retrieve all API Credentials
 * GET /api/vault/credentials
 */
router.get('/credentials', async (req: Request, res: Response) => {
  try {
    const rows = await dbQueryAll('SELECT id, service_name, key_name, credential_key, is_active, is_primary, usage_limit, current_usage, updated_at FROM api_credentials');
    return res.json({
      success: true,
      data: rows
    });
  } catch (error: any) {
    console.error('[ERROR] Fetching credentials failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 4.5 Save or update a named API Credential profile
 * POST /api/vault/credentials
 */
router.post('/credentials', async (req: Request, res: Response) => {
  try {
    const { id, service_name, key_name, credential_key } = req.body;
    if (!service_name || !credential_key) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (service_name and credential_key are required)'
      });
    }

    const now = new Date().toISOString();
    const name = key_name?.trim() || 'Default';

    if (id) {
      // Update existing
      await dbRun(
        'UPDATE api_credentials SET service_name = ?, key_name = ?, credential_key = ?, updated_at = ? WHERE id = ?',
        [service_name, name, credential_key, now, id]
      );
      return res.json({
        success: true,
        message: 'อัปเดตโปรไฟล์คีย์สำเร็จแล้ว!'
      });
    } else {
      // Insert new. Deactivate other profiles for this service first, as new profiles are active by default.
      await dbRun('UPDATE api_credentials SET is_active = 0, updated_at = ? WHERE service_name = ?', [now, service_name]);

      await dbRun(
        'INSERT INTO api_credentials (service_name, key_name, credential_key, is_active, is_primary, usage_limit, current_usage, updated_at) VALUES (?, ?, ?, 1, 0, 0.0, 0.0, ?)',
        [service_name, name, credential_key, now]
      );
      return res.json({
        success: true,
        message: 'เพิ่มโปรไฟล์คีย์ใหม่สำเร็จแล้ว!'
      });
    }
  } catch (error: any) {
    console.error('[ERROR] Saving credentials failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 4.6 Delete an API Credential profile
 * DELETE /api/vault/credentials/:id
 */
router.delete('/credentials/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM api_credentials WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบโปรไฟล์คีย์ที่ต้องการลบ'
      });
    }
    return res.json({
      success: true,
      message: 'ลบโปรไฟล์คีย์สำเร็จแล้ว!'
    });
  } catch (error: any) {
    console.error('[ERROR] Deleting credential failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 4.7 Toggle active status of a credential profile
 * POST /api/vault/credentials/:id/toggle
 */
router.post('/credentials/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await dbQueryGet('SELECT is_active, service_name FROM api_credentials WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบโปรไฟล์คีย์ที่ต้องการ'
      });
    }

    const newStatus = existing.is_active === 1 ? 0 : 1;
    const now = new Date().toISOString();

    if (newStatus === 1) {
      // Deactivate all other credentials for this service first
      await dbRun('UPDATE api_credentials SET is_active = 0, updated_at = ? WHERE service_name = ?', [now, existing.service_name]);
    }

    await dbRun('UPDATE api_credentials SET is_active = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

    return res.json({
      success: true,
      message: `เปลี่ยนสถานะคีย์สำเร็จแล้ว!`,
      is_active: newStatus
    });
  } catch (error: any) {
    console.error('[ERROR] Toggling credential failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 5. Sync API Credentials from Frontend (Git-Safe Browser Vault) to backend SQLite
 * POST /api/vault/credentials/sync
 */
router.post('/credentials/sync', async (req: Request, res: Response) => {
  try {
    const { credentials } = req.body;
    if (!credentials || typeof credentials !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'รูปแบบข้อมูลไม่ถูกต้อง (Invalid credentials payload)'
      });
    }

    const now = new Date().toISOString();

    for (const [service, val] of Object.entries(credentials)) {
      let key = '';
      let name = 'Default';

      if (typeof val === 'string') {
        key = val;
      } else if (val && typeof val === 'object') {
        key = (val as any).key || '';
        name = (val as any).name || 'Default';
      } else {
        continue;
      }

      const isActive = key.trim() !== '' ? 1 : 0;

      // Check if primary credential exists for this service
      const existing = await dbQueryGet(
        'SELECT id FROM api_credentials WHERE service_name = ? AND is_primary = 1 LIMIT 1',
        [service]
      );

      if (isActive === 1) {
        // Deactivate all other credentials for this service first
        await dbRun('UPDATE api_credentials SET is_active = 0, updated_at = ? WHERE service_name = ?', [now, service]);
      }

      if (existing) {
        await dbRun(
          'UPDATE api_credentials SET credential_key = ?, key_name = ?, is_active = ?, updated_at = ? WHERE service_name = ? AND is_primary = 1',
          [key, name, isActive, now, service]
        );
      } else {
        await dbRun(
          'INSERT INTO api_credentials (service_name, key_name, credential_key, is_active, is_primary, usage_limit, current_usage, updated_at) VALUES (?, ?, ?, ?, 1, 0.0, 0.0, ?)',
          [service, name, key, isActive, now]
        );
      }
    }

    return res.json({
      success: true,
      message: 'ซิงค์ข้อมูลกุญแจและโทเคนกับฐานข้อมูล SQLite เรียบร้อยแล้ว!'
    });
  } catch (error: any) {
    console.error('[ERROR] Credentials sync failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 6. Insert or Replace Scraped Content
 * POST /api/vault/contents
 */
router.post('/contents', async (req: Request, res: Response) => {
  try {
    const {
      id,
      source_type,
      title,
      selected_headline,
      raw_content,
      source_url,
      author_name,
      author_avatar_url,
      author_followers,
      metadata,
      media_paths,
      status
    } = req.body;

    if (!id || !source_type || !title || !source_url) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน (id, source_type, title, and source_url are required)'
      });
    }

    const now = new Date().toISOString();
    const statusVal = status || 'ready_for_design';
    const metaStr = metadata ? JSON.stringify(metadata) : '{}';
    const mediaStr = media_paths ? JSON.stringify(media_paths) : '[]';

    await dbRun(`
      INSERT OR REPLACE INTO vault_contents (
        id, source_type, title, selected_headline, raw_content, source_url, 
        author_name, author_avatar_url, author_followers, rating_news, rating_evergreen, 
        metadata_json, media_paths_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
    `, [
      id,
      source_type,
      title,
      selected_headline || null,
      raw_content || null,
      source_url,
      author_name || null,
      author_avatar_url || null,
      author_followers !== undefined ? Number(author_followers) : null,
      metaStr,
      mediaStr,
      statusVal,
      now,
      now
    ]);

    console.log(`[SUCCESS] Saved content to SQLite vault: ${id}`);
    return res.json({
      success: true,
      message: 'บันทึกข้อมูลเข้าคลังเรียบร้อยแล้ว!'
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to save content to vault:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 7. Logo Endpoints for Canvas branding stamps
 */

// 7.1 GET /api/vault/logos - list all saved logo files
router.get('/logos', async (req: Request, res: Response) => {
  try {
    const logosDir = path.join(VAULT_EXTERNAL_ROOT, 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    const files = fs.readdirSync(logosDir);
    const logoFiles = files
      .filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
      .map(filename => ({
        name: filename,
        url: `/api/vault/media?path=${encodeURIComponent(path.join('logos', filename))}`
      }));
    return res.json(logoFiles);
  } catch (error: any) {
    console.error('[ERROR] Failed to list logos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

// 7.2 POST /api/vault/logos - upload and save a logo file from base64
router.post('/logos', async (req: Request, res: Response) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุชื่อไฟล์และข้อมูล base64'
      });
    }

    const logosDir = path.join(VAULT_EXTERNAL_ROOT, 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Extract base64 payload
    const matches = base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    let dataBuffer: Buffer;
    if (matches && matches.length === 3) {
      dataBuffer = Buffer.from(matches[2], 'base64');
    } else {
      dataBuffer = Buffer.from(base64, 'base64');
    }

    const savePath = path.join(logosDir, filename);
    fs.writeFileSync(savePath, dataBuffer);

    console.log(`[SUCCESS] Saved page logo to vault: ${savePath}`);
    return res.json({
      success: true,
      url: `/api/vault/media?path=${encodeURIComponent(path.join('logos', filename))}`,
      message: 'บันทึกโลโก้เรียบร้อยแล้ว!'
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to save logo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

// 7.3 DELETE /api/vault/logos/:filename - delete a logo file
router.delete('/logos/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const logosDir = path.join(VAULT_EXTERNAL_ROOT, 'logos');
    const targetPath = path.join(logosDir, filename);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      console.log(`[SUCCESS] Deleted logo file: ${targetPath}`);
      return res.json({
        success: true,
        message: 'ลบไฟล์โลโก้สำเร็จ!'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบไฟล์โลโก้ที่ต้องการลบ'
      });
    }
  } catch (error: any) {
    console.error('[ERROR] Failed to delete logo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 8. High-Fidelity Thai Copywriting Simulator Fallback
 */
function generateSimulatedCopywriting(title: string, rawContent: string) {
  const lowerTitle = (title || '').toLowerCase();
  const lowerContent = (rawContent || '').toLowerCase();
  
  let topic = "นวัตกรรมและเทคโนโลยีใหม่";
  if (lowerTitle.includes("ai") || lowerTitle.includes("gpt") || lowerTitle.includes("agent") || lowerTitle.includes("gemini") || lowerTitle.includes("llm")) {
    topic = "เทคโนโลยีปัญญาประดิษฐ์ (AI Agent & LLMs)";
  } else if (lowerTitle.includes("prompt") || lowerContent.includes("prompt")) {
    topic = "การเขียน Prompt วิศวกรรมคำสั่ง";
  } else if (lowerTitle.includes("python") || lowerTitle.includes("rust") || lowerTitle.includes("javascript") || lowerTitle.includes("react") || lowerTitle.includes("code")) {
    topic = "การเขียนโปรแกรมและการพัฒนาซอฟต์แวร์";
  } else if (lowerTitle.includes("github") || lowerTitle.includes("git")) {
    topic = "โปรเจกต์โอเพนซอร์สระดับโลกบน GitHub";
  } else if (lowerTitle.includes("youtube") || lowerTitle.includes("video")) {
    topic = "การตลาดดิจิทัลและการสร้างวิดีโอคอนเทนต์";
  }

  const cleanTitle = title.replace(/^github_[^_]+_/, '').replace(/_/g, ' ');

  let emoji = "🚀";
  let hashtag = "#TechInnovation #ContentFactory";
  if (topic.includes("AI")) {
    emoji = "🤖";
    hashtag = "#ArtificialIntelligence #AIAgent #DeepLearning";
  } else if (topic.includes("Prompt")) {
    emoji = "✍️";
    hashtag = "#PromptEngineering #AIHacks #Productivity";
  } else if (topic.includes("โปรแกรม")) {
    emoji = "💻";
    hashtag = "#Programming #Coding #Developer #OpenSource";
  } else if (topic.includes("GitHub")) {
    emoji = "🔥";
    hashtag = "#GitHub #OpenSource #DevTools";
  }

  const caption = `${emoji} [เจาะลึกนวัตกรรมล่าสุด] ทุกคนต้องฟังสิ่งนี้! วันนี้เรามาวิเคราะห์เรื่อง "${cleanTitle}" ซึ่งเป็นประเด็นร้อนแรงในวงการ ${topic}\n\n` +
    `💡 หลายคนอาจจะยังไม่รู้ว่าสิ่งนี้กำลังจะเข้ามาเปลี่ยนรูปแบบการทำงานและชีวิตประจำวันของเราไปอย่างสิ้นเชิง ด้วยขีดความสามารถที่สูงขึ้นและแนวคิดที่ล้ำสมัย\n\n` +
    `📌 ไฮไลท์เด็ดที่น่าสนใจ:\n` +
    `• ออกแบบมาเพื่อประสิทธิภาพขั้นสุดและใช้งานง่าย\n` +
    `• ลดเวลาทำงานลงกว่า 10 เท่า ตอบโจทย์ไลฟ์สไตล์ยุคใหม่\n` +
    `• เป็นโซลูชันที่นักพัฒนาและผู้ใช้ทั่วโลกกำลังให้ความสนใจ\n\n` +
    `อ่านรายละเอียดเชิงลึกและแนวทางการประยุกต์ใช้งานได้ในคอมเม้นท์ด้านล่างเลยครับ! 👇👇\n\n` +
    `${hashtag} #ContentLab`;

  const headlines = [
    `🔥 ช็อกวงการ! เจาะลึกความล้ำ "${cleanTitle}" ที่คุณต้องรู้วันนี้`,
    `🚀 เคล็ดลับการใช้ "${cleanTitle}" ช่วยย่นเวลาทำงานเพิ่มขึ้น 10 เท่า!`,
    `💡 สรุปสั้นๆ ใน 1 นาที ทำไม "${cleanTitle}" ถึงเป็นเครื่องมือแห่งอนาคต`,
    `💻 เปิดวิธีเซ็ตอัป "${cleanTitle}" โปรเจกต์ยอดฮิตที่กำลังเป็นกระแสร้อนแรง`,
    `⚠️ ห้ามพลาดเด็ดขาด! โคลนด่วนก่อนตกขบวนเทคโนโลยี "${cleanTitle}"`
  ];

  const headline_3line = [
    `ข่าวด่วนที่สุด!`,
    `เจาะลึกสุดยอด ${cleanTitle}`,
    `เพิ่มประสิทธิภาพ 10 เท่า`
  ];

  const comments = [
    `📍 [แนะนำข้อมูลเบื้องหลัง] สิ่งนี้ถูกคิดค้นขึ้นมาเพื่อแก้ไขปัญหาคอขวดที่หลายๆ คนต้องเผชิญในการทำงานร่วมกับระบบเดิมครับ จุดเด่นคือการนำโครงสร้างสถาปัตยกรรมแบบกระจายตัวมาประยุกต์ใช้ ทำให้ประมวลผลเร็วขึ้นมาก!`,
    `⚙️ [วิธีนำไปประยุกต์ใช้งานจริง] สำหรับใครที่อยากเริ่มต้นแนะนำให้ทดสอบผ่าน Demo ตัวอย่างก่อนนะครับ โคลนสคริปต์มาลงใน Workspace จากนั้นรันคำสั่งเพียงขั้นตอนเดียวก็เห็นผลลัพธ์ทันที!`,
    `🔗 [สรุป FOMO ส่งท้าย] เทคโนโลยีไปเร็วมากครับ ถ้าเริ่มช้ากว่าคนอื่นก้าวเดียว วันพรุ่งนี้เราอาจจะต้องเหนื่อยไล่ตาม แนะนำคลิกไปดูหน้าโปรเจกต์ต้นทางและกด Star บันทึกไว้เลยครับ!`
  ];

  const headline_3line_keywords = [
    "ข่าวด่วนที่สุด",
    cleanTitle.split(' ')[0] || "เจาะลึก",
    "10 เท่า"
  ];

  return {
    caption,
    comments,
    headlines,
    headline_3line,
    headline_3line_keywords,
    highlight: headline_3line_keywords.filter(Boolean).join(',')
  };
}

/**
 * 9. AI Copywriting Generation Endpoint
 * POST /api/vault/contents/:id/generate-copywriting
 */
router.post('/contents/:id/generate-copywriting', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback, length, font_scale, writing_style_prompt, headline_style_examples } = req.body || {};

    // 1. Fetch content item from vault
    const content = await dbQueryGet('SELECT * FROM vault_contents WHERE id = ?', [id]);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบเนื้อหาที่ระบุ (Content item not found)'
      });
    }

    // Parse existing metadata
    let metadata: any = {};
    if (content.metadata_json) {
      try {
        metadata = JSON.parse(content.metadata_json);
      } catch (err) {
        metadata = {};
      }
    }

    // 2. Query active API key (prefer client-supplied openrouter_key if provided)
    let apiKey = '';
    const clientKey = req.body?.openrouter_key;
    if (clientKey && typeof clientKey === 'string' && clientKey.trim() !== '') {
      apiKey = clientKey.trim();
    } else {
      try {
        const activeKeyRow = await dbQueryGet(
          "SELECT credential_key FROM api_credentials WHERE service_name = 'openrouter' AND is_active = 1 ORDER BY is_primary DESC, updated_at DESC LIMIT 1"
        );
        if (activeKeyRow && activeKeyRow.credential_key && !activeKeyRow.credential_key.startsWith('MOCK_')) {
          apiKey = activeKeyRow.credential_key;
        }
      } catch (err) {
        console.warn("Failed to retrieve api key from DB", err);
      }
    }

    let copywritingData: any = null;

    if (!apiKey) {
      console.log(`[COPYWRITING] No active API key found for content ID ${id}, falling back to simulator`);
      copywritingData = {
        ...generateSimulatedCopywriting(content.title, content.raw_content || ''),
        is_simulated: true,
        error_message: 'ไม่พบ API Key สำหรับ OpenRouter'
      };
    } else {
      // Assemble custom instructions based on feedback & length & font_scale
      const scale = parseFloat(font_scale) || 1.0;
      // Standard line fits about 38 characters at 1.0. At larger font scales, the line width decreases proportionally.
      const charLimit = Math.max(14, Math.floor(38 / scale));

      let customInstructions = '';
      customInstructions += `- CHARACTER LENGTH CONSTRAINT FOR 3-LINE HEADLINES: Due to a selected font scale of ${scale}x, EACH line in 'headline_3line' MUST contain strictly at most ${charLimit} characters (including spaces, symbols, and Thai vowels/tone marks). Make sure lines are extremely concise so they do not wrap into multiple lines! Try to target exactly ${charLimit - 2} to ${charLimit} characters per line!\n`;

      if (writing_style_prompt) {
        customInstructions += `- WRITING STYLE TONE & RULES: You MUST write the post caption in this style:\n${writing_style_prompt}\n`;
      }

      if (headline_style_examples) {
        const examplesStr = Array.isArray(headline_style_examples) ? headline_style_examples.join('\n- ') : headline_style_examples;
        customInstructions += `- IDEAL HEADLINE STYLE EXAMPLES (Produce headlines matching this formula/tone): \n- ${examplesStr}\n`;
      }

      if (length) {
        const lenOpt = {
          short: '500-800 characters (Thai)',
          medium: '900-1300 characters (Thai)',
          long: '1500-2200 characters (Thai)',
          deep: '2500-3500 characters (Thai)'
        }[length as 'short' | 'medium' | 'long' | 'deep'] || '900-1300 characters (Thai)';
        customInstructions += `- ARTICLE/CAPTION LENGTH RULE: The generated caption/article must be approximately ${lenOpt}.\n`;
      }
      if (feedback) {
        customInstructions += `- FEEDBACK CORRECTION RULE: You MUST adjust the style or content according to the user's feedback/teaching request: "${feedback}". Please refine/rewrite the caption, comments, headlines, and headline_3line based on this constraint!\n`;
      }

      let existingCopywritingContext = '';
      if (metadata.copywriting) {
        existingCopywritingContext = `
Here is the previous generated version that needs improvement:
- Old Caption: "${metadata.copywriting.caption || ''}"
- Old Headlines: ${JSON.stringify(metadata.copywriting.headlines || [])}
- Old 3-line Headline: ${JSON.stringify(metadata.copywriting.headline_3line || [])}
`;
      }

      const prompt = `
You are an expert copywriter for Thai tech, AI, and business marketing community pages.
Analyze the following article/content:
Title: ${content.title}
Content: ${content.raw_content || ''}
${existingCopywritingContext}
${customInstructions}

== CRITICAL INSTRUCTION ON STYLE TEMPLATES ==
- The "WRITING STYLE TONE & RULES" (and "IDEAL HEADLINE STYLE EXAMPLES") provided are ONLY examples of the writing style, tone, format, and structure.
- DO NOT copy the literal text, numbers, or specific topic from the style template. You MUST generate a completely unique post caption and headlines based strictly on the provided "Title" and "Content" of the source article.
- Each generated post must focus on the unique details, tools, names, video duration, and numbers of the specific source article (e.g., if the title is about 5 Use Cases, write about 5 Use Cases; if it's a 22-minute tutorial, write about 22 minutes).
- DO NOT repeat the exact same template phrases (like "สร้างกองทัพ AI 15 ตัว", "กลับมาที่ Claude เพื่อนรัก ฮ่าๆ") for every post unless it is the core topic of that specific article. Be creative and vary the phrasing!

== MANDATORY STYLE RULES FOR THAI 3-LINE HEADLINES (headline_3line) ==
Produce an extremely engaging, high-converting Thai 3-line headline following this exact, highly viral formula:
- Line 1 (Bold Achievement/Goal/Outcome & Speed): Focus on massive achievements, income, high-value outcomes, or speed. e.g. "สร้างรายได้หลักล้านต่อเดือนด้วยตัวคนเดียว" or "เริ่มสร้างธุรกิจของตัวเองได้ภายใน 30 วัน" or "บริการออกแบบเว็บไซต์แบบ 3D" or "สร้างรายได้หลักล้านต่อเดือนด้วยตัวคนเดียว"
- Line 2 (Mechanism/Technology/AI Tool): Explains the "how" (mechanism/technology) in a highly viral way. e.g. "โดยใช้แค่ AI ในการให้บริการลูกค้าทั้งหมด" or "ด้วยการใช้เพียงแค่ Claude AI Pro เท่านั้น" or "จากการสร้าง app กว่า 35 ตัวด้วย AI"
- Line 3 (Value/Strategy/Secrets/Framework Promise): Delivers a powerful concluding promise of a comprehensive strategy, summary, secrets, or framework. e.g. "สรุปกลยุทธ์ทั้งหมดที่เขาทำตั้งแต่เริ่ม" or "สรุปออกมาเป็น framework ที่สามารถทำตามได้" or "และนี่คือวิธีและเคล็ดลับทั้งหมดที่เขาทำ" or "Meta ธุรกิจแบบใหม่ที่เรียกว่า Solo Agency"

Produce a response that is a VALID, parsable JSON object containing the following structure:
{
  "caption": "A captivating, engaging post caption in Thai, with emojis and hashtags. Make it interesting and easy to read, perfect for Facebook/LinkedIn/Twitter.",
  "comments": [
    "Paragraph 1 for comment section (under the post) to add context or start conversation.",
    "Paragraph 2 for comment section.",
    "Paragraph 3 for comment section."
  ],
  "headlines": [
    "Headline option 1 (short, punchy, viral Thai headline)",
    "Headline option 2",
    "Headline option 3",
    "Headline option 4",
    "Headline option 5"
  ],
  "headline_3line": [
    "Line 1 (MUST satisfy character limit of ${charLimit} characters)",
    "Line 2 (MUST satisfy character limit of ${charLimit} characters)",
    "Line 3 (MUST satisfy character limit of ${charLimit} characters)"
  ],
  "headline_3line_keywords": [
    "One exact word or short phrase present in Line 1 to highlight (or blank if nothing)",
    "One exact word or short phrase present in Line 2 to highlight (or blank if nothing)",
    "One exact word or short phrase present in Line 3 to highlight (or blank if nothing)"
  ]
}

Return ONLY the JSON string. Do not wrap in markdown or any other text.
`;

      try {
        console.log(`[COPYWRITING] Calling AI for content ID ${id} using google/gemini-2.5-flash`);
        let resJson: any = null;
        let responseObj: any = null;
        if (apiKey.startsWith('AIzaSy')) {
          // Direct Google Gemini API call
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.5
              }
            })
          });
          responseObj = response;
          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Google Gemini direct API call failed: ${response.status} ${errBody}`);
          }
          const googleData: any = await response.json();
          if (googleData?.error) {
            throw new Error(`Google Gemini Error: ${googleData.error.message}`);
          }
          const txt = googleData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!txt) {
            throw new Error('Google Gemini returned empty candidate content');
          }
          resJson = {
            choices: [{ message: { content: txt } }]
          };
        } else {
          // Normal OpenRouter call
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "HTTP-Referer": "https://github.com/ContentFactory",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.5
            })
          });
          responseObj = response;
          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter API call failed: ${response.status} ${errBody}`);
          }
          resJson = await response.json();
        }

        if (resJson) {
          if (resJson.error) {
            throw new Error(`OpenRouter error response: ${resJson.error.message || JSON.stringify(resJson.error)}`);
          }
          if (!resJson.choices || resJson.choices.length === 0) {
            throw new Error(`Invalid OpenRouter response: choices is empty or missing. Response: ${JSON.stringify(resJson)}`);
          }
          let responseText = resJson.choices[0].message.content.trim();
          
          if (responseText.startsWith("```")) {
            const lines = responseText.split("\n");
            if (lines[0].startsWith("```json") || lines[0].startsWith("```")) {
              responseText = lines.slice(1, -1).join("\n").trim();
            }
          }

          const parsed = JSON.parse(responseText);
          if (parsed.caption && parsed.comments && parsed.headlines && parsed.headline_3line) {
            if (parsed.headline_3line_keywords) {
              parsed.highlight = parsed.headline_3line_keywords.filter(Boolean).join(',');
            }
            copywritingData = {
              ...parsed,
              is_simulated: false
            };
            console.log(`[SUCCESS] AI generated copywriting for content ID ${id}`);
          } else {
            throw new Error('AI response is missing required fields (caption, comments, headlines, or headline_3line)');
          }
        } else {
          throw new Error(responseObj ? `AI responded with status ${responseObj.status}` : 'No response from AI engine');
        }
      } catch (err: any) {
        console.warn(`[WARN] OpenRouter generation failed for ${id}, falling back to simulator:`, err);
        copywritingData = {
          ...generateSimulatedCopywriting(content.title, content.raw_content || ''),
          is_simulated: true,
          error_message: err.message || String(err)
        };
      }
    }

    // 3. Save to database in metadata_json and selected_headline
    metadata.copywriting = copywritingData;
    const now = new Date().toISOString();

    let selectedHeadline = content.selected_headline;
    if (copywritingData && copywritingData.headline_3line && copywritingData.headline_3line.length > 0) {
      selectedHeadline = copywritingData.headline_3line.filter(Boolean).join('\n');
    }

    await dbRun(
      'UPDATE vault_contents SET metadata_json = ?, selected_headline = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(metadata), selectedHeadline, now, id]
    );

    console.log(`[SUCCESS] Saved generated copywriting into SQLite for content ID: ${id}`);
    
    return res.json({
      success: true,
      message: 'สร้างบทความและจำลองพาดหัวเรียบร้อยแล้ว!',
      data: copywritingData
    });

  } catch (error: any) {
    console.error('[ERROR] Copywriting generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 9.5. Save manually updated content metadata
 * PUT /api/vault/contents/:id/metadata
 */
router.put('/contents/:id/metadata', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุข้อมูล metadata ที่ต้องการอัปเดต (metadata object is required)'
      });
    }

    const now = new Date().toISOString();
    await dbRun(
      'UPDATE vault_contents SET metadata_json = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(metadata), now, id]
    );

    console.log(`[SUCCESS] Manually updated metadata in SQLite for content ID: ${id}`);
    return res.json({
      success: true,
      message: 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!'
    });
  } catch (error: any) {
    console.error('[ERROR] Metadata manual update failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 9.6. Automatically select background images based on face detection
 * POST /api/vault/contents/auto-select-bg-images
 */
router.post('/contents/auto-select-bg-images', async (req: Request, res: Response) => {
  try {
    // 1. Fetch all items with status 'ready_for_design'
    const sql = "SELECT * FROM vault_contents WHERE status = 'ready_for_design'";
    const rows = await dbQueryAll(sql);

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: 'ไม่พบรายการที่อยู่ในสถานะรอสร้าง (No items with status ready_for_design)',
        count: 0,
        data: []
      });
    }

    // 2. Extract and format media paths
    const itemsToProcess = rows.map((row: any) => {
      let mediaPaths: string[] = [];
      let metadata: any = {};
      try {
        if (row.media_paths_json) {
          mediaPaths = JSON.parse(row.media_paths_json);
        }
      } catch (e) {
        console.warn(`Failed to parse media_paths_json for ID ${row.id}`, e);
      }
      try {
        if (row.metadata_json) {
          metadata = JSON.parse(row.metadata_json);
        }
      } catch (e) {
        console.warn(`Failed to parse metadata_json for ID ${row.id}`, e);
      }
      return {
        ...row,
        media_paths: mediaPaths,
        metadata: metadata
      };
    }).filter(item => item.media_paths && item.media_paths.length > 0);

    if (itemsToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'ไม่พบรูปภาพในรายการที่รอสร้าง (No items with media paths)',
        count: 0,
        data: []
      });
    }

    // 3. Compile a list of unique absolute paths of all candidate frames
    const absPathToRelMap = new Map<string, string>();
    const absolutePaths: string[] = [];
    
    for (const item of itemsToProcess) {
      for (const relPath of item.media_paths) {
        const absPath = path.resolve(VAULT_EXTERNAL_ROOT, relPath);
        if (!absPathToRelMap.has(absPath)) {
          absPathToRelMap.set(absPath, relPath);
          absolutePaths.push(absPath);
        }
      }
    }

    // 4. Run scripts/auto_select_faces.py by writing the paths JSON to stdin
    let scores: Record<string, number> = {};
    if (absolutePaths.length > 0) {
      const { execFileSync } = require('child_process');
      const scriptPath = path.resolve(__dirname, '../../../scripts/auto_select_faces.py');
      
      try {
        const resultJson = execFileSync('python3', [scriptPath], {
          input: JSON.stringify(absolutePaths),
          encoding: 'utf-8',
          maxBuffer: 20 * 1024 * 1024 // 20MB
        });
        scores = JSON.parse(resultJson);
      } catch (err: any) {
        console.error('[ERROR] Failed to run auto_select_faces.py:', err);
        // Fall back to empty scores
      }
    }

    // Helper to get score of absolute path
    const getFaceScore = (relPath: string): number => {
      const absPath = path.resolve(VAULT_EXTERNAL_ROOT, relPath);
      return scores[absPath] || 0;
    };

    // 5. Update each item's copywriting.selected_bg_image based on scores
    const now = new Date().toISOString();
    const updatedItems: any[] = [];

    for (const item of itemsToProcess) {
      // Find the frame path with the highest score
      let bestPath = item.media_paths[0];
      let maxScore = -1;

      for (const relPath of item.media_paths) {
        const score = getFaceScore(relPath);
        if (score > maxScore) {
          maxScore = score;
          bestPath = relPath;
        }
      }

      // If no face was found (maxScore <= 0), default to the first image
      if (maxScore <= 0) {
        bestPath = item.media_paths[0];
      }

      // Update metadata structure
      const metadata = item.metadata || {};
      if (!metadata.copywriting) {
        metadata.copywriting = {};
      }
      metadata.copywriting.selected_bg_image = bestPath;

      // Update DB
      await dbRun(
        'UPDATE vault_contents SET metadata_json = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(metadata), now, item.id]
      );

      updatedItems.push({
        ...item,
        metadata: metadata,
        media_paths: item.media_paths
      });
    }

    return res.json({
      success: true,
      message: `อัปเดตรูปพื้นหลังอัตโนมัติสำเร็จแล้ว ${updatedItems.length} รายการ`,
      count: updatedItems.length,
      data: updatedItems
    });

  } catch (error: any) {
    console.error('[ERROR] Auto-select background images failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 11. Export Content Data as CSV + List Rendered Images for Browser Download
 * POST /api/vault/export-local
 *
 * Request body:
 * - content_ids: string[] of vault_contents IDs to export
 * 
 * Returns CSV content as string + list of image paths for browser-side File System Access API download
 */
router.post('/export-local', async (req: Request, res: Response) => {
  try {
    const { content_ids } = req.body;

    if (!content_ids || !Array.isArray(content_ids) || content_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุรายการ ID ชิ้นคอนเทนต์ (content_ids array is required)'
      });
    }

    // 1. Query vault_contents for the specified IDs
    const placeholders = content_ids.map(() => '?').join(',');
    const contents: any[] = await dbQueryAll(
      `SELECT id, title, source_type, selected_headline, metadata_json, media_paths_json, status, created_at FROM vault_contents WHERE id IN (${placeholders})`,
      content_ids
    );

    // 2. Query generated_graphics for the newest rendered images linked to these content IDs
    const graphics: any[] = await dbQueryAll(
      `SELECT content_id, file_path, MAX(created_at) FROM generated_graphics WHERE content_id IN (${placeholders}) GROUP BY content_id`,
      content_ids
    );

    // 3. Build CSV content
    const csvHeader = 'id,title,source_type,selected_headline,post_content,keywords,render_path,status,created_at';
    
    // Build a lookup: content_id -> first render file_path
    const renderMap = new Map<string, string>();
    for (const g of graphics) {
      if (!renderMap.has(g.content_id)) {
        renderMap.set(g.content_id, g.file_path);
      }
    }

    const csvRows = contents.map((row: any) => {
      let keywords = '';
      let postContent = '';
      try {
        if (row.metadata_json) {
          const meta = JSON.parse(row.metadata_json);
          if (meta.keywords) {
            keywords = Array.isArray(meta.keywords) ? meta.keywords.join(';') : String(meta.keywords);
          } else if (meta.tags) {
            keywords = Array.isArray(meta.tags) ? meta.tags.join(';') : String(meta.tags);
          }
          if (meta.copywriting && meta.copywriting.caption) {
            postContent = meta.copywriting.caption;
          }
        }
      } catch (_) { /* ignore parse errors */ }

      const renderPath = renderMap.get(row.id) || '';
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

      return [
        escape(row.id),
        escape(row.title),
        escape(row.source_type),
        escape(row.selected_headline || ''),
        escape(postContent),
        escape(keywords),
        escape(renderPath),
        escape(row.status || ''),
        escape(row.created_at || '')
      ].join(',');
    });

    const csvContent = '\ufeff' + [csvHeader, ...csvRows].join('\n'); // BOM for Excel UTF-8

    // 4. Build image list with absolute paths for browser download
    const images = graphics.map(g => {
      const absPath = path.isAbsolute(g.file_path)
        ? g.file_path
        : path.resolve(VAULT_EXTERNAL_ROOT, g.file_path);
      return {
        path: g.file_path,
        filename: path.basename(absPath),
        exists: fs.existsSync(absPath)
      };
    }).filter(img => img.exists);

    console.log(`[SUCCESS] Export prepared: ${contents.length} records, ${images.length} images`);
    return res.json({
      success: true,
      csv_content: csvContent,
      images,
      total_records: contents.length
    });
  } catch (error: any) {
    console.error('[ERROR] Export-local failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 11. Stock Random Image Picker
 * GET /api/vault/stock-random?folder=/absolute/path/to/stock/folder
 * 
 * Lists all image files in the given folder and returns one at random.
 * Used by Graphic Canvas to pull a random stock background image.
 */
router.get('/stock-random', (req: Request, res: Response) => {
  const folder = req.query.folder as string;

  if (!folder) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ path ของโฟลเดอร์ stock (folder query parameter is required)'
    });
  }

  // Verify folder exists
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบโฟลเดอร์ stock ที่ระบุ'
    });
  }

  try {
    const files = fs.readdirSync(folder);
    const imageFiles = files.filter(f => /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(f));

    if (imageFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบไฟล์รูปภาพในโฟลเดอร์ stock ที่ระบุ'
      });
    }

    // Pick a random image
    const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    const absolutePath = path.join(folder, randomFile);

    return res.json({
      success: true,
      filename: randomFile,
      absolute_path: absolutePath,
      total_stock: imageFiles.length
    });
  } catch (error: any) {
    console.error('[ERROR] Stock random pick failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 11.1 List all stock images in a folder
 * GET /api/vault/stock-list?folder=/absolute/path/to/stock/folder
 */
router.get('/stock-list', (req: Request, res: Response) => {
  const folder = req.query.folder as string;

  if (!folder) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ path ของโฟลเดอร์ stock'
    });
  }

  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบโฟลเดอร์ stock ที่ระบุ'
    });
  }

  try {
    const files = fs.readdirSync(folder);
    const imageFiles = files.filter(f => /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(f));

    return res.json({
      success: true,
      total: imageFiles.length,
      files: imageFiles.map(f => ({
        filename: f,
        absolute_path: path.join(folder, f)
      }))
    });
  } catch (error: any) {
    console.error('[ERROR] Stock list failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 12. Dropbox Upload - Single File
 * POST /api/vault/dropbox/upload
 *
 * Uploads a single file from the content vault to Dropbox and returns a shared link.
 */
router.post('/dropbox/upload', async (req: Request, res: Response) => {
  try {
    const { file_path, dropbox_token, dropbox_folder } = req.body;

    if (!file_path || !dropbox_token || !dropbox_folder) {
      return res.status(400).json({
        success: false,
        error: 'file_path, dropbox_token, and dropbox_folder are required'
      });
    }

    // Security: block path traversal
    if (file_path.includes('..') || file_path.includes('~')) {
      return res.status(403).json({
        success: false,
        error: 'Invalid file_path: path traversal not allowed'
      });
    }

    const absoluteFilePath = path.join(VAULT_EXTERNAL_ROOT, file_path);

    // Verify file is within vault root
    if (!absoluteFilePath.startsWith(VAULT_EXTERNAL_ROOT)) {
      return res.status(403).json({
        success: false,
        error: 'File path is outside the content vault'
      });
    }

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${file_path}`
      });
    }

    const fileBuffer = fs.readFileSync(absoluteFilePath);
    const filename = path.basename(file_path);
    const dropboxPath = `${dropbox_folder}/${filename}`;

    console.log(`[DROPBOX] Uploading file: ${file_path} -> ${dropboxPath}`);

    // Step 1: Upload file to Dropbox
    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropbox_token}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
          mute: false
        }),
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log(`[DROPBOX] Upload failed: ${uploadResponse.status} ${errorText}`);
      return res.status(502).json({
        success: false,
        error: `Dropbox upload failed: ${uploadResponse.status}`,
        details: errorText
      });
    }

    const uploadResult = await uploadResponse.json() as any;
    const actualDropboxPath = uploadResult.path_display || dropboxPath;
    console.log(`[DROPBOX] Upload successful: ${actualDropboxPath}`);

    // Step 2: Create shared link
    let sharedLink = '';

    const createLinkResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropbox_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: actualDropboxPath,
        settings: {
          requested_visibility: 'public',
          audience: 'public',
          access: 'viewer'
        }
      })
    });

    if (createLinkResponse.ok) {
      const linkResult = await createLinkResponse.json() as any;
      sharedLink = linkResult.url || '';
      console.log(`[DROPBOX] Shared link created: ${sharedLink}`);
    } else {
      // Check if the error is because a shared link already exists
      const linkErrorText = await createLinkResponse.text();
      console.log(`[DROPBOX] Create shared link response: ${createLinkResponse.status} ${linkErrorText}`);

      let isAlreadyExists = false;
      try {
        const linkError = JSON.parse(linkErrorText);
        if (
          linkError?.error?.['.tag'] === 'shared_link_already_exists' ||
          linkErrorText.includes('shared_link_already_exists')
        ) {
          isAlreadyExists = true;
        }
      } catch {
        if (linkErrorText.includes('shared_link_already_exists')) {
          isAlreadyExists = true;
        }
      }

      if (isAlreadyExists) {
        console.log(`[DROPBOX] Shared link already exists, fetching existing link...`);
        const listLinksResponse = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dropbox_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: actualDropboxPath,
            direct_only: true
          })
        });

        if (listLinksResponse.ok) {
          const listResult = await listLinksResponse.json() as any;
          if (listResult.links && listResult.links.length > 0) {
            sharedLink = listResult.links[0].url || '';
            console.log(`[DROPBOX] Found existing shared link: ${sharedLink}`);
          }
        } else {
          const listErrorText = await listLinksResponse.text();
          console.log(`[DROPBOX] Failed to list shared links: ${listLinksResponse.status} ${listErrorText}`);
        }
      }
    }

    // Step 3: Convert shared link to direct download
    if (sharedLink) {
      if (sharedLink.includes('?dl=0')) {
        sharedLink = sharedLink.replace('?dl=0', '?dl=1');
      } else if (sharedLink.includes('?')) {
        sharedLink += '&dl=1';
      } else {
        sharedLink += '?dl=1';
      }
    }

    console.log(`[DROPBOX] Final shared link: ${sharedLink}`);

    return res.json({
      success: true,
      dropbox_path: actualDropboxPath,
      shared_link: sharedLink
    });
  } catch (error: any) {
    console.error('[ERROR] Dropbox upload failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 12.1 Dropbox Upload - Batch
 * POST /api/vault/dropbox/batch-upload
 *
 * Uploads multiple files from the content vault to Dropbox and returns shared links.
 */
router.post('/dropbox/batch-upload', async (req: Request, res: Response) => {
  try {
    const { file_paths, dropbox_token, dropbox_folder } = req.body;

    if (!file_paths || !Array.isArray(file_paths) || file_paths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'file_paths (non-empty array), dropbox_token, and dropbox_folder are required'
      });
    }

    if (!dropbox_token || !dropbox_folder) {
      return res.status(400).json({
        success: false,
        error: 'dropbox_token and dropbox_folder are required'
      });
    }

    console.log(`[DROPBOX BATCH] Starting batch upload of ${file_paths.length} files to ${dropbox_folder}`);

    const results: Array<{
      file_path: string;
      dropbox_path: string;
      shared_link: string;
      error?: string;
    }> = [];

    for (const filePath of file_paths) {
      try {
        // Security: block path traversal
        if (filePath.includes('..') || filePath.includes('~')) {
          results.push({
            file_path: filePath,
            dropbox_path: '',
            shared_link: '',
            error: 'Invalid file_path: path traversal not allowed'
          });
          continue;
        }

        const absoluteFilePath = path.join(VAULT_EXTERNAL_ROOT, filePath);

        if (!absoluteFilePath.startsWith(VAULT_EXTERNAL_ROOT)) {
          results.push({
            file_path: filePath,
            dropbox_path: '',
            shared_link: '',
            error: 'File path is outside the content vault'
          });
          continue;
        }

        if (!fs.existsSync(absoluteFilePath)) {
          results.push({
            file_path: filePath,
            dropbox_path: '',
            shared_link: '',
            error: `File not found: ${filePath}`
          });
          continue;
        }

        const fileBuffer = fs.readFileSync(absoluteFilePath);
        const filename = path.basename(filePath);
        const dropboxPath = `${dropbox_folder}/${filename}`;

        console.log(`[DROPBOX BATCH] Uploading: ${filePath} -> ${dropboxPath}`);

        // Step 1: Upload file to Dropbox
        const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dropbox_token}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: dropboxPath,
              mode: 'add',
              autorename: true,
              mute: false
            }),
            'Content-Type': 'application/octet-stream'
          },
          body: fileBuffer
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.log(`[DROPBOX BATCH] Upload failed for ${filePath}: ${uploadResponse.status} ${errorText}`);
          results.push({
            file_path: filePath,
            dropbox_path: '',
            shared_link: '',
            error: `Dropbox upload failed: ${uploadResponse.status} - ${errorText}`
          });
          continue;
        }

        const uploadResult = await uploadResponse.json() as any;
        const actualDropboxPath = uploadResult.path_display || dropboxPath;
        console.log(`[DROPBOX BATCH] Upload successful: ${actualDropboxPath}`);

        // Step 2: Create shared link
        let sharedLink = '';

        const createLinkResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dropbox_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: actualDropboxPath,
            settings: {
              requested_visibility: 'public',
              audience: 'public',
              access: 'viewer'
            }
          })
        });

        if (createLinkResponse.ok) {
          const linkResult = await createLinkResponse.json() as any;
          sharedLink = linkResult.url || '';
        } else {
          const linkErrorText = await createLinkResponse.text();
          console.log(`[DROPBOX BATCH] Create shared link response for ${filePath}: ${createLinkResponse.status} ${linkErrorText}`);

          let isAlreadyExists = false;
          try {
            const linkError = JSON.parse(linkErrorText);
            if (
              linkError?.error?.['.tag'] === 'shared_link_already_exists' ||
              linkErrorText.includes('shared_link_already_exists')
            ) {
              isAlreadyExists = true;
            }
          } catch {
            if (linkErrorText.includes('shared_link_already_exists')) {
              isAlreadyExists = true;
            }
          }

          if (isAlreadyExists) {
            const listLinksResponse = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${dropbox_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: actualDropboxPath,
                direct_only: true
              })
            });

            if (listLinksResponse.ok) {
              const listResult = await listLinksResponse.json() as any;
              if (listResult.links && listResult.links.length > 0) {
                sharedLink = listResult.links[0].url || '';
              }
            }
          }
        }

        // Step 3: Convert shared link to direct download
        if (sharedLink) {
          if (sharedLink.includes('?dl=0')) {
            sharedLink = sharedLink.replace('?dl=0', '?dl=1');
          } else if (sharedLink.includes('?')) {
            sharedLink += '&dl=1';
          } else {
            sharedLink += '?dl=1';
          }
        }

        results.push({
          file_path: filePath,
          dropbox_path: actualDropboxPath,
          shared_link: sharedLink
        });
      } catch (fileError: any) {
        console.error(`[DROPBOX BATCH] Error processing ${filePath}:`, fileError);
        results.push({
          file_path: filePath,
          dropbox_path: '',
          shared_link: '',
          error: fileError.message || 'Unknown error'
        });
      }
    }

    console.log(`[DROPBOX BATCH] Completed. ${results.filter(r => !r.error).length}/${file_paths.length} files uploaded successfully.`);

    return res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('[ERROR] Dropbox batch upload failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

/**
 * 12.2 Dropbox Exchange Auth Code for Access/Refresh Tokens
 * POST /api/vault/dropbox/exchange-token
 */
router.post('/dropbox/exchange-token', async (req: Request, res: Response) => {
  try {
    const { code, client_id, client_secret, redirect_uri } = req.body;
    if (!code || !client_id || !client_secret || !redirect_uri) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: code, client_id, client_secret, or redirect_uri'
      });
    }

    console.log(`[DROPBOX OAUTH] Exchanging auth code for tokens... App Key: ${client_id}`);
    
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        redirect_uri
      })
    });

    const data = await response.json() as any;
    if (data.error) {
      console.error('[DROPBOX OAUTH] Exchange failed:', data);
      return res.status(400).json({
        success: false,
        error: data.error_description || data.error
      });
    }

    console.log('[DROPBOX OAUTH] Exchange successful! Received access token and refresh token.');
    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[ERROR] Dropbox token exchange failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
});

export default router;

