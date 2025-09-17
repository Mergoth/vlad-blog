// CASCADE: Netlify Build Hook - automatically broadcast new posts after deploy
// This runs during Netlify build process, no GitHub Actions needed

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function getNewPosts() {
  try {
    // CASCADE: Get files changed in last commit (Netlify provides COMMIT_REF)
    const commitRef = process.env.COMMIT_REF || 'HEAD'
    const prevCommit = `${commitRef}~1`
    
    const changedFiles = execSync(`git diff --name-only --diff-filter=A ${prevCommit} ${commitRef}`, 
      { encoding: 'utf8' }).trim()
    
    if (!changedFiles) return []
    
    return changedFiles
      .split('\n')
      .filter(file => file.match(/src\/content\/.*\/posts\/.*\.md$/))
  } catch (error) {
    console.log('CASCADE: Could not detect new posts:', error.message)
    return []
  }
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  
  const frontmatter = {}
  const lines = match[1].split('\n')
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()
    
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    frontmatter[key] = value
  }
  
  return frontmatter
}

function getLanguageFromPath(filePath) {
  const match = filePath.match(/src\/content\/([^\/]+)\/posts/)
  return match ? match[1] : 'en'
}

function getSlugFromPath(filePath) {
  const basename = path.basename(filePath, '.md')
  const lang = getLanguageFromPath(filePath)
  return `/${lang}/posts/${basename}`
}

async function sendBroadcast(payload) {
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://vlad-blog.netlify.app'
  const adminToken = process.env.PUSH_ADMIN_TOKEN
  
  if (!adminToken) {
    console.log('CASCADE: No PUSH_ADMIN_TOKEN set, skipping broadcast')
    return
  }
  
  const url = `${siteUrl}/api/push/broadcast`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    console.log(`CASCADE: Broadcast sent - ${result.sent} notifications, ${result.removed} expired`)
  } catch (error) {
    console.error('CASCADE: Broadcast failed:', error.message)
  }
}

exports.handler = async (event, context) => {
  // CASCADE: Only run on successful deploy
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }
  
  console.log('CASCADE: Checking for new posts to broadcast...')
  
  const newPosts = getNewPosts()
  if (newPosts.length === 0) {
    console.log('CASCADE: No new posts detected')
    return { statusCode: 200, body: JSON.stringify({ message: 'No new posts' }) }
  }
  
  console.log(`CASCADE: Found ${newPosts.length} new posts:`, newPosts)
  
  for (const postFile of newPosts) {
    try {
      const content = fs.readFileSync(postFile, 'utf8')
      const frontmatter = extractFrontmatter(content)
      const lang = getLanguageFromPath(postFile)
      const slug = getSlugFromPath(postFile)
      
      const title = frontmatter.title || 'New Blog Post'
      const description = frontmatter.description || frontmatter.excerpt || 'Check out the latest update!'
      
      const titlePrefixes = {
        en: 'New Post',
        es: 'Nueva Entrada', 
        ru: 'Новая Запись'
      }
      
      const payload = {
        title: `${titlePrefixes[lang] || titlePrefixes.en}: ${title}`,
        body: description,
        url: slug,
        icon: '/favicon.svg',
        tag: 'new-post'
      }
      
      console.log(`CASCADE: Broadcasting: ${title} (${lang})`)
      await sendBroadcast(payload)
      
    } catch (error) {
      console.error(`CASCADE: Failed to process ${postFile}:`, error.message)
    }
  }
  
  return { 
    statusCode: 200, 
    body: JSON.stringify({ message: `Processed ${newPosts.length} posts` }) 
  }
}
