/**
 * Author Pool — Filipino male authors for blog E-E-A-T
 * Each article randomly picks one author for authentic feel.
 */

export interface BlogAuthor {
  name: string;
  title: string;
  bio: string;
}

const AUTHORS: BlogAuthor[] = [
  {
    name: 'Marco Reyes',
    title: 'Signage Specialist & Project Manager',
    bio: 'Marco is a signage specialist and project manager with hands-on experience in acrylic fabrication, stainless steel lettering, and LED installation. He shares practical insights from the workshop floor to help business owners make informed signage decisions.',
  },
  {
    name: 'Daniel Santos',
    title: 'Senior Fabrication Engineer',
    bio: 'Daniel leads the fabrication team, specializing in CNC routing, laser cutting, and metal finishing. He writes about materials, manufacturing processes, and quality standards from years of hands-on production experience.',
  },
  {
    name: 'Rafael Cruz',
    title: 'Installation Lead & Site Supervisor',
    bio: 'Rafael oversees signage installations across Metro Manila. With extensive field experience in mounting systems, electrical wiring, and structural safety, he provides practical installation guides and maintenance tips.',
  },
  {
    name: 'Miguel Navarro',
    title: 'Design & Branding Consultant',
    bio: 'Miguel works with clients on signage design, brand identity, and visual strategy. He writes about design trends, color psychology, and how effective signage drives foot traffic for retail businesses.',
  },
  {
    name: 'Carlo Mendoza',
    title: 'Business Development Manager',
    bio: 'Carlo helps business owners choose the right signage solutions for their needs and budget. He covers pricing guides, ROI analysis, permit requirements, and industry best practices in the Philippines market.',
  },
  {
    name: 'Jericho Ramos',
    title: 'LED & Electrical Systems Technician',
    bio: 'Jericho specializes in LED modules, lighting controllers, and power systems for illuminated signage. He writes technical guides on LED technology, energy efficiency, and smart signage innovations.',
  },
  {
    name: 'Anton Villanueva',
    title: 'Quality Assurance & Compliance Officer',
    bio: 'Anton ensures all projects meet safety standards and local regulations. He covers DPWH requirements, LGU ordinances, building codes, and fire safety compliance for signage installations in the Philippines.',
  },
  {
    name: 'Paolo Garcia',
    title: 'Workshop Operations Manager',
    bio: 'Paolo manages day-to-day workshop operations, from material sourcing to production scheduling. He shares behind-the-scenes knowledge about signage manufacturing and project management.',
  },
];

/**
 * Pick a random author from the pool.
 * Optionally pass a category slug to bias toward a relevant specialist.
 */
export function pickRandomAuthor(categorySlug?: string): BlogAuthor {
  // Category-specialist mapping (soft preference, not mandatory)
  const specialistMap: Record<string, string[]> = {
    'signage-materials': ['Daniel Santos', 'Paolo Garcia'],
    'installation-guides': ['Rafael Cruz', 'Jericho Ramos'],
    'maintenance-care': ['Rafael Cruz', 'Daniel Santos'],
    'design-inspiration': ['Miguel Navarro'],
    'pricing-cost-guides': ['Carlo Mendoza', 'Paolo Garcia'],
    'permits-regulations': ['Anton Villanueva', 'Carlo Mendoza'],
    'industry-spotlight': ['Carlo Mendoza', 'Miguel Navarro'],
    'project-showcases': ['Marco Reyes', 'Rafael Cruz'],
    'business-tips': ['Carlo Mendoza', 'Miguel Navarro'],
    'technology-innovation': ['Jericho Ramos', 'Daniel Santos'],
  };

  // 70% chance to use a specialist if available for this category
  if (categorySlug && specialistMap[categorySlug] && Math.random() < 0.7) {
    const specialists = specialistMap[categorySlug];
    const name = specialists[Math.floor(Math.random() * specialists.length)];
    const author = AUTHORS.find(a => a.name === name);
    if (author) return author;
  }

  // Random pick from full pool
  return AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
}
