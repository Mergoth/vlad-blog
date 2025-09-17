// CASCADE: Netlify build plugin to auto-broadcast new posts (ESM)
// Runs in your existing Netlify build, uses same environment variables

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function getNewPosts() {
  try {
    // CASCADE: Get newly added markdown files from git
    const changedFiles = execSync('git diff --name-only --diff-filter=A HEAD~1 HEAD', 
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

async function sendBroadcast(payload, siteUrl, adminToken) {
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

export const onSuccess = async ({ utils, constants }) => {
    console.log('CASCADE: Checking for new posts to broadcast...')
    
    const adminToken = process.env.PUSH_ADMIN_TOKEN
    if (!adminToken) {
      console.log('CASCADE: No PUSH_ADMIN_TOKEN set, skipping broadcast')
      return
    }
    
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://vlad-blog.netlify.app'
    const newPosts = getNewPosts()
    
    if (newPosts.length === 0) {
      console.log('CASCADE: No new posts detected')
      return
    }
    
    console.log(`CASCADE: Found ${newPosts.length} new posts:`, newPosts)
    
    // CASCADE: Wait a moment for the site to be fully deployed
    await new Promise(resolve => setTimeout(resolve, 5000))
    
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
        await sendBroadcast(payload, siteUrl, adminToken)
        
      } catch (error) {
        console.error(`CASCADE: Failed to process ${postFile}:`, error.message)
      }
    }
}
