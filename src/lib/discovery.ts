import { siteConfig } from "./site";
import { projects } from "./projects";
import { faqs } from "./faqs";

export function discoveryText(full = false) {
  const url = siteConfig.url;
  const summary = `# ${siteConfig.name}\n\n> ${siteConfig.description}\n\nSilentCPO takes a holistic approach: understand the business problem, question assumptions, agree what is needed, then design and build the solution. Clients work directly with one specialist.\n\n## Public pages\n\n- [Insights](${url}/blog): Practical articles about planning and building digital products.\n- [Home](${url}/): About the studio and its approach.\n- [Selected work](${url}/#work): ${projects.length} examples of delivered work.\n- [Capabilities](${url}/#capabilities): Websites, apps, and bespoke platforms.\n- [Process](${url}/#process): Discovery, architecture, build, and launch.\n- [Common questions](${url}/#faq): Scope, approach, and getting started.\n- [Contact](${url}/#contact): Enquiries receive a response within 24 hours.\n- [Privacy](${url}/privacy): How enquiry data is handled.\n\n## Services\n\n${siteConfig.services.map((service) => `- ${service}`).join("\n")}\n\n## Selected work\n\n${projects.map((project) => `- ${project.url ? `[${project.name}](${project.url})` : project.name}: ${project.description}`).join("\n")}\n\n## Contact\n\nEmail: ${siteConfig.contact.email}\nResponse time: within 24 hours.\n`;
  const stories = projects.flatMap((project) => project.story ? [
    `### ${project.name}: ${project.story.title}\n\nThe challenge: ${project.story.challenge}\n\nThe approach: ${project.story.approach}\n\nThe build: ${project.story.built}\n\nWhat it enables: ${project.story.enables}`,
  ] : []).join("\n\n");
  return full
    ? `${summary}\n## Project stories\n\n${stories}\n\n## Common questions\n\n${faqs.map(({ question, answer }) => `### ${question}\n\n${answer}`).join("\n\n")}\n`
    : `${summary}\n## Optional\n\n- [Extended text](${url}/llms-full.txt): The same public information with answers to common questions.\n`;
}

export function textResponse(full = false) {
  return new Response(discoveryText(full), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
