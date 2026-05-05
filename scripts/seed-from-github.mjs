import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
// Using Node 18+ native fetch (no node-fetch needed)

// STEP 2 — CONFIGURE CLIENTS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// CATEGORY MAPPING
const CATEGORY_MAP = {
  "Portrait & Photography Cases": "photography",
  "Poster & Illustration Cases": "advertising",
  "Character Design Cases": "3d-art",
  "UI & Social Media Mockup Cases": "ui-design",
}

// AUTO-TAG GENERATION
const TAG_KEYWORDS = [
  'portrait', 'cinematic', 'anime', 'poster', 'illustration', 'ui', 'mockup',
  'character', 'film', 'watercolor', 'minimal', 'fantasy', 'neon', 'vintage',
  'editorial', 'design', 'japanese', 'chinese', 'futuristic', '3d', 'sketch'
]

function generateTags(prompt_text) {
  const lowerPrompt = prompt_text.toLowerCase()
  const found = TAG_KEYWORDS.filter(tag => lowerPrompt.includes(tag))
  if (found.length === 0) return ['gpt-image-2', 'ai-art']
  return found.slice(0, 5)
}

async function main() {
  console.log("Fetching README from GitHub...")
  
  // STEP 3 — FETCH AND PARSE THE README
  const response = await fetch('https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main/README.md')
  const text = await response.text()
  const lines = text.split('\n')

  let currentCategorySlug = null
  let cases = []
  let currentCase = null
  let parsingPrompt = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect category
    if (line.startsWith('## ')) {
      currentCategorySlug = null
      for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
        if (line.includes(key)) {
          currentCategorySlug = slug
          break
        }
      }
      continue
    }

    // Detect new case
    const caseMatch = line.match(/^### Case \d+:\s*(.+?)\s*\(by\s*(.+?)\)/)
    if (caseMatch) {
      // Save previous case if it exists
      if (currentCase && currentCase.prompt_text.trim() && currentCase.image_path && currentCase.category_slug) {
        cases.push(currentCase)
      }

      let rawTitle = caseMatch[1]
      let rawAuthor = caseMatch[2]

      // Extract text from markdown links if present
      const titleMatch = rawTitle.match(/\[([^\]]+)\]/)
      const title = titleMatch ? titleMatch[1] : rawTitle.replace(/\[|\]|\(.*\)/g, '').trim()

      const authorMatch = rawAuthor.match(/\[([^\]]+)\]/)
      const author = authorMatch ? authorMatch[1] : rawAuthor.replace(/\[|\]|\(.*\)/g, '').trim()

      currentCase = {
        title,
        author,
        category_slug: currentCategorySlug,
        image_path: null,
        prompt_text: '',
        tags: [],
      }
      parsingPrompt = false
      continue
    }

    if (!currentCase) continue

    // Detect image path/URL
    // Look for src="..." or standard markdown ![]()
    const srcMatch = line.match(/src="([^"]+)"/)
    if (srcMatch) {
      currentCase.image_path = srcMatch[1]
    } else if (line.match(/!\[.*?\]\((.+?)\)/)) {
      currentCase.image_path = line.match(/!\[.*?\]\((.+?)\)/)[1]
    } else if (line.includes('|') && line.includes('http')) {
      const links = line.match(/(https?:\/\/[^\s\|]+)/g)
      if (links) {
        for (const l of links) {
          if (l.match(/\.(jpg|jpeg|png|gif|webp)/i) || l.includes('pbs.twimg.com')) {
            if (!currentCase.image_path) currentCase.image_path = l
          }
        }
      }
    }

    // Detect prompt
    if (line.startsWith('**Prompt:**') || line.startsWith('**Prompt**:')) {
      parsingPrompt = true
      continue
    }

    if (parsingPrompt) {
      if (line.trim().startsWith('```')) {
        continue
      }
      if (line.startsWith('### Case')) {
        parsingPrompt = false
      } else {
        if (line.trim() || currentCase.prompt_text.length > 0) {
          currentCase.prompt_text += line + '\n'
        }
      }
    }
  }

  // Add the last case
  if (currentCase && currentCase.prompt_text.trim() && currentCase.image_path && currentCase.category_slug) {
    cases.push(currentCase)
  }

  // Clean up prompts and tags, resolve relative image paths
  cases.forEach(c => {
    c.prompt_text = c.prompt_text.trim()
    c.tags = generateTags(c.prompt_text)
    
    if (c.image_path && c.image_path.startsWith('/')) {
      c.image_path = 'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-prompts/main' + c.image_path
    }
  })

  // Filter out any invalid cases (e.g., from categories we skipped)
  cases = cases.filter(c => c.category_slug !== null && c.image_path !== null && c.prompt_text !== '')

  console.log(`Parsed ${cases.length} valid cases to process.`)

  // STEP 4 — FETCH CATEGORY IDs FROM SUPABASE
  const { data: categories, error: catError } = await supabase.from('categories').select('id, slug')
  if (catError) {
    console.error("Failed to fetch categories:", catError.message)
    process.exit(1)
  }

  const categoryMap = {}
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id
  })

  // STEP 5 — PROCESS EACH CASE
  let uploadedCount = 0
  let skippedFailedCount = 0
  const failedCases = []

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    const indexStr = `[${i + 1}/${cases.length}]`
    
    try {
      const catId = categoryMap[c.category_slug]
      if (!catId) {
        throw new Error(`Category slug '${c.category_slug}' not found in DB`)
      }

      // 5c. Check if duplicate
      const { data: existing } = await supabase
        .from('prompts')
        .select('id')
        .eq('title', c.title)
        .single()
        
      if (existing) {
        console.log(`⏩ ${indexStr} Skipping duplicate: "${c.title}"`)
        skippedFailedCount++
        continue
      }

      // 5a. DOWNLOAD THE IMAGE
      const imgRes = await fetch(c.image_path)
      if (!imgRes.ok) {
        throw new Error(`404 or bad response on image download: ${c.image_path}`)
      }
      
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mime = imgRes.headers.get('content-type') || 'image/jpeg'

      // 5b. UPLOAD IMAGE TO CLOUDINARY
      const sanitizedTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50)
      
      const uploadResult = await cloudinary.uploader.upload(
        `data:${mime};base64,${base64}`,
        {
          folder: 'promptgpt/seed',
          public_id: `${c.category_slug}_${sanitizedTitle}`,
          overwrite: false,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        }
      )
      
      const image_url = uploadResult.secure_url

      // 5c. INSERT INTO SUPABASE
      // Calculate is_featured (first 6 cases per category are featured)
      // Since cases are typically ordered by category, we can just use overall index or keep it simple
      const isFeatured = i < 6

      const { error: insertError } = await supabase.from('prompts').insert({
        title: c.title,
        prompt_text: c.prompt_text,
        image_url: image_url,
        category_id: catId,
        tags: c.tags,
        is_featured: isFeatured,
        copy_count: 0,
        created_by: null,
      })

      if (insertError) {
        throw new Error(`Supabase insert failed: ${insertError.message}`)
      }

      console.log(`✅ ${indexStr} Uploaded: "${c.title}" → cloudinary ✓ → supabase ✓`)
      uploadedCount++

    } catch (err) {
      console.log(`❌ ${indexStr} Failed: "${c.title}" — reason: ${err.message}`)
      skippedFailedCount++
      failedCases.push({ title: c.title, error: err.message })
    }

    // 500ms delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  // STEP 6 — LOGGING AND PROGRESS
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`SEED COMPLETE`)
  console.log(`Total parsed:   ${cases.length}`)
  console.log(`Uploaded:       ${uploadedCount}`)
  console.log(`Skipped/Failed: ${skippedFailedCount}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // STEP 7 — ERROR HANDLING RULES
  if (failedCases.length > 0) {
    console.log("List of failed cases:")
    failedCases.forEach(fc => console.log(`- ${fc.title}: ${fc.error}`))
  }
}

main().catch(console.error)
