export const projects = [
  { id: 1, title: 'Exoplanet Biosignatures', piName: 'Dr. Alice Bennett', institution: 'Caltech', topic: 'Astrobiology', year: 2021, description: 'Search for biosignatures on exoplanets using spectral modeling.' },
  { id: 2, title: 'Microbial Planetary Protection', piName: 'Dr. Jorge Ramos', institution: 'MIT', topic: 'Planetary Protection', year: 2020, description: 'Study of microbial survivability in spacecraft cleanrooms.' },
  { id: 3, title: 'Lunar Regolith Ecology', piName: 'Prof. Mei Ling', institution: 'University of Arizona', topic: 'Lunar Science', year: 2022, description: 'Simulate plant growth in regolith analogs.' },
  { id: 4, title: 'Mars Subsurface Hydrology', piName: 'Dr. Rahul Singh', institution: 'JPL', topic: 'Mars Science', year: 2019, description: 'Model subsurface water flows and habitability potential.' },
  { id: 5, title: 'Deep Space Radiation Biology', piName: 'Dr. Emily Carter', institution: 'Johns Hopkins', topic: 'Human Health', year: 2023, description: 'Radiation effects on mammalian tissue in deep space conditions.' },
  { id: 6, title: 'Planetary Atmosphere Chemistry', piName: 'Dr. Sven Olsson', institution: 'University of Oslo', topic: 'Atmospheric Science', year: 2018, description: 'Photochemistry models of early Earth-like atmospheres.' },
  { id: 7, title: 'ISS Microbiome Dynamics', piName: 'Dr. Aisha Khan', institution: 'University of Houston', topic: 'Human Health', year: 2022, description: 'Temporal study of microbial communities aboard the ISS.' },
  { id: 8, title: 'Synthetic Biology for Resource ISRU', piName: 'Prof. Miguel Santos', institution: 'Rice University', topic: 'ISRU', year: 2021, description: 'Engineered microbes to extract resources from regolith.' },
  { id: 9, title: 'Remote Sensing Vegetation in Arid Planets', piName: 'Dr. Helena Ortiz', institution: 'Stanford', topic: 'Remote Sensing', year: 2020, description: 'Algorithms to detect sparse biosignatures in arid environments.' },
  { id: 10, title: 'Cryo-ecosystems on Europa', piName: 'Dr. Kenji Watanabe', institution: 'Tokyo Tech', topic: 'Ocean Worlds', year: 2024, description: 'Modeling potential chemoautotrophic communities under Europa ice.' },
  { id: 11, title: 'Astrochemistry of Organic Molecules', piName: 'Dr. Priya Nair', institution: 'Caltech', topic: 'Astrochemistry', year: 2019, description: 'Formation pathways of complex organics in protostellar disks.' },
  { id: 12, title: 'Robotic Sample Return Contamination', piName: 'Dr. Samir Patel', institution: 'JPL', topic: 'Planetary Protection', year: 2021, description: 'Strategies to avoid forward/backward contamination during sample return.' },
  { id: 13, title: 'Biomarkers in Ancient Terrains', piName: 'Dr. Laura Green', institution: 'UCL', topic: 'Geobiology', year: 2018, description: 'Geochemical proxies for ancient life in terrestrial analogs.' },
  { id: 14, title: 'Plant Growth in Microgravity', piName: 'Prof. Anders Berg', institution: 'KTH', topic: 'Human Health', year: 2020, description: 'Agroponic systems optimized for microgravity environments.' },
  { id: 15, title: 'Mars Dust Toxicity', piName: 'Dr. Nina Rossi', institution: 'University of Milan', topic: 'Mars Science', year: 2023, description: 'Toxicological assessment of fine regolith particles.' }
];

export const nodes = () => {
  // Build simple network: project nodes connected to topic hubs and institution hubs
  const pr = projects.map(p => ({ id: 'p-'+p.id, type: 'project', name: p.title, projectId: p.id }));
  const topics = Array.from(new Set(projects.map(p => p.topic))).map((t,i)=>({ id: 't-'+i, type:'topic', name:t }));
  const insts = Array.from(new Set(projects.map(p=>p.institution))).map((s,i)=>({ id:'i-'+i, type:'inst', name:s }));
  const links = [];
  pr.forEach(pn=>{
    const p = projects.find(x=>x.id===pn.projectId);
    const topic = topics.find(t=>t.name===p.topic);
    const inst = insts.find(i=>i.name===p.institution);
    links.push({ source: pn.id, target: topic.id });
    links.push({ source: pn.id, target: inst.id });
  });
  return { nodes: [...pr,...topics,...insts], links };
};
