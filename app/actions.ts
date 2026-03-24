'use server'

import { ErrorType } from '@/utils/detectErrorType'

interface FixSuggestion {
  title: string
  code?: string
}

interface ErrorAnalysis {
  explanation: string
  possibleCauses: string[]
  fixSuggestions: FixSuggestion[]
}

// Mock AI analysis - In production, this would call an actual AI API
async function mockAIAnalysis(prompt: string): Promise<ErrorAnalysis> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Determine response type from prompt
  if (prompt.includes('Next.js')) {
    return {
      explanation: "This Next.js error typically occurs when trying to access a property or method on undefined data during server-side rendering or hydration.",
      possibleCauses: [
        "Attempting to access nested properties on undefined data",
        "Server and client state mismatch during hydration",
        "Async data not being awaited before rendering"
      ],
      fixSuggestions: [
        {
          title: "Add optional chaining",
          code: `// Before
<div>{data.user.name}</div>

// After
<div>{data?.user?.name}</div>`
        },
        {
          title: "Use getServerSideProps or Server Components",
          code: `// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()
  return <div>{data.name}</div>
}`
        },
        {
          title: "Check for undefined before render",
          code: `if (!data) {
  return <div>Loading...</div>
}
return <Component data={data} />`
        }
      ]
    }
  }

  if (prompt.includes('Module not found')) {
    return {
      explanation: "The Node.js module loader cannot find the specified module in your project's node_modules or system paths.",
      possibleCauses: [
        "Module is not installed",
        "Typo in module name or import path",
        "Working directory is incorrect"
      ],
      fixSuggestions: [
        {
          title: "Install missing dependency",
          code: `pnpm add missing-module-name`
        },
        {
          title: "Check import path",
          code: `// Wrong
import MyComponent from '../components/MyComponent'

// Correct (file: MyComponent.tsx)
import MyComponent from '../components/MyComponent'
// or
import { MyComponent } from '../components/MyComponent'`
        },
        {
          title: "Verify working directory",
          code: `# From correct directory
cd /path/to/your/project
npm run dev`
        }
      ]
    }
  }

  // Default JavaScript error response
  return {
    explanation: "This error occurs when you try to access a property or call a method on a value that is undefined or null.",
    possibleCauses: [
      "Variable not initialized or assigned a value",
      "API call failed and returned undefined",
      "Object property doesn't exist in the data structure"
    ],
    fixSuggestions: [
      {
        title: "Add optional chaining",
        code: `// Before
const name = user.profile.name

// After
const name = user?.profile?.name`
      },
      {
        title: "Provide default values",
        code: `const name = user?.profile?.name ?? 'Anonymous'
const items = data?.items ?? []`
      },
      {
        title: "Validate before access",
        code: `if (user?.profile?.name) {
  console.log(user.profile.name)
} else {
  console.log('Name not available')
}`
      }
    ]
  }
}

export async function analyzeError(prompt: string): Promise<ErrorAnalysis> {
  return mockAIAnalysis(prompt)
}
