export interface ExamplePrompt {
  text: string;
  persona: string;
}

// A flattened array of all example prompts for the "I'm Feeling Lucky" and scrolling examples feature.
export const allExamplePrompts: ExamplePrompt[] = [
  { text: 'Create a modern, responsive UI component for a user profile card using React and Tailwind CSS. It should include an avatar, name, username, a short bio, and social media links.', persona: 'frontend-developer' },
  { text: 'Design the complete specification for a REST API endpoint to fetch a user\'s profile data. Include details on the HTTP method, URL structure, and an example of the JSON response.', persona: 'backend-developer' },
  { text: 'Outline the complete user journey for a new "Task Dependencies" feature in a project management application, from creation to visualization on a timeline.', persona: 'ui-ux-designer' },
  { text: 'Write a Python script using pandas and matplotlib to clean a customer dataset and visualize the distribution of customer ages and purchase frequency.', persona: 'data-scientist' },
  { text: 'Generate three distinct, catchy headlines and a short paragraph of ad copy for a new eco-friendly subscription box service targeting millennials.', persona: 'marketing-guru' },
  { text: 'Write a short and punchy re-engagement email for customers who haven\'t purchased in 90 days, offering a personalized 15% discount on their next order.', persona: 'marketing-guru' },
  { text: 'Write the compelling opening scene of a sci-fi mystery novel set on a desolate Martian colony, where the lead detective discovers a cryptic message.', persona: 'creative-storyteller' },
  { text: 'Brainstorm 5 viral video ideas for a new sustainable fashion brand on TikTok, focusing on behind-the-scenes content and styling tips.', persona: 'content-creator' },
  { text: 'Draft a clear, step-by-step guide for new hires on setting up their local development environment, including software installation and configuration.', persona: 'technical-writer' },
  { text: 'Formulate a specific research question and testable hypothesis for a study on the effects of a four-day work week on employee productivity and well-being.', persona: 'academic-researcher' },
  { text: 'Review a sample Non-Disclosure Agreement (NDA) and identify clauses that are overly broad or potentially unfavorable to an independent contractor.', persona: 'legal-advisor' },
];