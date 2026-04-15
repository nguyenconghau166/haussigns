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
  {
    name: 'Andrei Tolentino',
    title: 'CNC Operator & Fabrication Specialist',
    bio: 'Andrei runs the CNC routing and laser cutting machines. He writes detailed guides on material cutting techniques, tolerances, and finishing methods for acrylic, aluminum, and composite signage panels.',
  },
  {
    name: 'Joaquin dela Cruz',
    title: 'Structural Engineer',
    bio: 'Joaquin handles structural calculations and wind load analysis for large-format signage. He covers billboard engineering, pylon sign foundations, and safety standards for elevated installations.',
  },
  {
    name: 'Nico Bautista',
    title: 'Vinyl & Print Specialist',
    bio: 'Nico specializes in vinyl wrapping, large-format printing, and tarpaulin signage. He shares tips on material selection, UV resistance, and print quality for outdoor advertising in the Philippine climate.',
  },
  {
    name: 'Gabriel Lim',
    title: 'Account Manager & Client Relations',
    bio: 'Gabriel works directly with business owners to plan their signage projects from concept to completion. He writes about client communication, project timelines, and how to get the best value from your signage investment.',
  },
  {
    name: 'Elijah Soriano',
    title: 'Paint & Coating Technician',
    bio: 'Elijah handles automotive-grade painting, powder coating, and protective finishes for metal signage. He covers color matching, weather-resistant coatings, and surface preparation techniques.',
  },
  {
    name: 'Christian Pascual',
    title: 'Neon & Channel Letter Specialist',
    bio: 'Christian builds custom channel letters and faux neon signs using LED flex tubes. He writes about letter fabrication methods, illumination options, and installation techniques for storefront signage.',
  },
  {
    name: 'Benedict Torres',
    title: 'Digital Signage & AV Technician',
    bio: 'Benedict installs and programs digital displays, LED video walls, and interactive kiosks. He covers content management systems, display technology comparisons, and smart signage solutions for modern businesses.',
  },
  {
    name: 'Jerome Aquino',
    title: 'Welding & Metalwork Foreman',
    bio: 'Jerome leads the metal fabrication crew, handling TIG and MIG welding for stainless steel and aluminum signage frames. He writes about structural assembly, joint quality, and metalwork best practices.',
  },
  {
    name: 'Ryan Magbanua',
    title: 'Estimator & Cost Analyst',
    bio: 'Ryan prepares project quotations and cost breakdowns for signage projects of all sizes. He writes detailed pricing guides, material cost comparisons, and budgeting tips for business owners.',
  },
  {
    name: 'Luis Arevalo',
    title: 'Permit & Compliance Coordinator',
    bio: 'Luis handles signage permit applications across Metro Manila municipalities. He covers LGU requirements, DPWH regulations, barangay clearances, and the step-by-step permit process for business signage.',
  },
  {
    name: 'Kevin Tan',
    title: 'Graphic Designer & Layout Artist',
    bio: 'Kevin creates signage layouts, mock-ups, and 3D visualizations for client approval. He writes about typography for signage, color contrast for visibility, and design principles that maximize brand impact.',
  },
  {
    name: 'Mark Villena',
    title: 'Maintenance & Repair Technician',
    bio: 'Mark handles signage repair, LED module replacement, and preventive maintenance. He shares practical maintenance schedules, troubleshooting tips, and cleaning guides to extend the life of commercial signs.',
  },
  {
    name: 'Jose Miguel Flores',
    title: 'Sales & Marketing Coordinator',
    bio: 'Jose Miguel helps businesses maximize their storefront visibility through strategic signage placement. He writes about marketing psychology, foot traffic optimization, and how signage impacts customer behavior.',
  },
  {
    name: 'Adrian Castillo',
    title: 'Logistics & Installation Coordinator',
    bio: 'Adrian coordinates signage deliveries and installation schedules across Luzon. He covers site preparation, crane operations, night installations, and safety protocols for large signage projects.',
  },
  {
    name: 'Dominic Reyes',
    title: 'Acrylic Specialist & Thermoforming Expert',
    bio: 'Dominic specializes in acrylic bending, thermoforming, and edge-lit signage techniques. He writes about acrylic grades, light diffusion, and how to achieve premium results for indoor business signage.',
  },
  {
    name: 'Vincent Ocampo',
    title: 'Electrical & Transformer Specialist',
    bio: 'Vincent handles power supply systems, LED drivers, and transformer installations for illuminated signage. He covers wattage calculations, energy-efficient lighting, and electrical safety for sign installations.',
  },
  {
    name: 'Patrick Salazar',
    title: 'Wayfinding & Environmental Graphics Designer',
    bio: 'Patrick designs wayfinding systems, directional signage, and environmental graphics for commercial complexes. He writes about ADA compliance, hospital wayfinding, and mall directory sign systems.',
  },
  {
    name: 'Alvin Manalo',
    title: 'Franchise & Multi-Location Signage Consultant',
    bio: 'Alvin manages signage rollouts for franchise and multi-branch businesses. He covers brand consistency across locations, bulk ordering strategies, and nationwide installation coordination.',
  },
  {
    name: 'Jayson del Rosario',
    title: 'Billboard & Large-Format Specialist',
    bio: 'Jayson handles billboard fabrication, tri-vision panels, and large-format pylon signs. He writes about outdoor advertising effectiveness, structural requirements, and material selection for weather-exposed installations.',
  },
  {
    name: 'Enrique Dizon',
    title: 'Quality Control Inspector',
    bio: 'Enrique inspects finished signage for dimensional accuracy, color consistency, and structural integrity before delivery. He shares quality checklists, common defects to watch for, and industry standards for commercial signage.',
  },
];

/**
 * Pick a random author from the pool.
 * Optionally pass a category slug to bias toward a relevant specialist.
 */
export function pickRandomAuthor(categorySlug?: string): BlogAuthor {
  // Category-specialist mapping (soft preference, not mandatory)
  const specialistMap: Record<string, string[]> = {
    'signage-materials': ['Daniel Santos', 'Andrei Tolentino', 'Dominic Reyes', 'Nico Bautista', 'Elijah Soriano', 'Jerome Aquino'],
    'installation-guides': ['Rafael Cruz', 'Adrian Castillo', 'Joaquin dela Cruz', 'Vincent Ocampo'],
    'maintenance-care': ['Mark Villena', 'Rafael Cruz', 'Elijah Soriano'],
    'design-inspiration': ['Miguel Navarro', 'Kevin Tan', 'Patrick Salazar', 'Christian Pascual'],
    'pricing-cost-guides': ['Ryan Magbanua', 'Carlo Mendoza', 'Gabriel Lim'],
    'permits-regulations': ['Luis Arevalo', 'Anton Villanueva'],
    'industry-spotlight': ['Carlo Mendoza', 'Jose Miguel Flores', 'Alvin Manalo', 'Patrick Salazar'],
    'project-showcases': ['Marco Reyes', 'Gabriel Lim', 'Adrian Castillo', 'Paolo Garcia'],
    'business-tips': ['Jose Miguel Flores', 'Carlo Mendoza', 'Alvin Manalo', 'Gabriel Lim'],
    'technology-innovation': ['Jericho Ramos', 'Benedict Torres', 'Vincent Ocampo'],
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
