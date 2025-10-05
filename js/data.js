// Sample dataset of NASA-funded research projects
const projects = [
  { id: 1, title: "Exoplanet Biosignatures", piName: "Dr. Alice Bennett", institution: "Caltech", topic: "Astrobiology", year: 2021, description: "Search for biosignatures in exoplanet atmospheres using spectroscopy and modeling." },
  { id: 16, title: "Sample Paper: Exoplanet Methods", piName: "Dr. Alice Bennett", institution: "Caltech", topic: "Astrobiology", year: 2021, description: "A sample paper demonstrating linking behavior.", sourceUrl: "https://example.com/exoplanet-paper", pdfLinks: ["https://example.com/exoplanet-paper.pdf"] },
  { id: 2, title: "Mars Subsurface Hydrology", piName: "Dr. Rahul Singh", institution: "JPL", topic: "Mars Science", year: 2019, description: "Characterizing subsurface water reservoirs on Mars using radar and modeling." },
  { id: 3, title: "Deep Space Radiation Biology", piName: "Dr. Emily Carter", institution: "Johns Hopkins", topic: "Human Health", year: 2023, description: "Investigating biological impacts of deep space radiation on mammalian cells." },
  { id: 4, title: "Cryo-ecosystems on Europa", piName: "Dr. Kenji Watanabe", institution: "Tokyo Tech", topic: "Ocean Worlds", year: 2024, description: "Study of potential cryo-ecosystems beneath Europa's ice shell." },
  { id: 5, title: "Microbial Geochemistry of Martian Analog Sites", piName: "Dr. Ana Morales", institution: "UC Santa Cruz", topic: "Geobiology", year: 2020, description: "Field studies of terrestrial analog sites to understand microbial signatures." },
  { id: 6, title: "In-Situ Resource Utilization for Lunar ISRU", piName: "Dr. Mark Petersen", institution: "University of Arizona", topic: "ISRU", year: 2022, description: "Develop methods for extracting oxygen and metals from lunar regolith." },
  { id: 7, title: "Planetary Protection Protocols", piName: "Dr. Helena Ruiz", institution: "NASA Ames", topic: "Planetary Protection", year: 2021, description: "Policies and technologies to avoid forward/back contamination." },
  { id: 8, title: "High-Resolution Remote Sensing for Vegetation", piName: "Dr. Omar Haddad", institution: "MIT", topic: "Remote Sensing", year: 2018, description: "Develop hyperspectral approaches for biosphere monitoring from orbit." },
  { id: 9, title: "Astrochemical Pathways in Protoplanetary Disks", piName: "Dr. Li Wei", institution: "Harvard", topic: "Astrochemistry", year: 2019, description: "Modeling chemical evolution in planet-forming disks." },
  { id: 10, title: "Human Physiology in Microgravity", piName: "Dr. Sara Johnson", institution: "Mayo Clinic", topic: "Human Health", year: 2020, description: "Study physiological adaptations to long-duration microgravity exposure." },
  { id: 11, title: "Seafloor Imaging of Ocean Worlds", piName: "Dr. Carlos Mendez", institution: "Scripps Institution of Oceanography", topic: "Ocean Worlds", year: 2022, description: "Develop deep-sea imaging tech relevant to icy moons exploration." },
  { id: 12, title: "Remote Sensing of Permafrost Dynamics", piName: "Dr. Ingrid Olsen", institution: "University of Alaska", topic: "Remote Sensing", year: 2021, description: "Monitoring thaw and carbon release using SAR and multispectral data." },
  { id: 13, title: "Microgravity Crystal Growth", piName: "Dr. Viktor Petrov", institution: "MIT", topic: "Materials Science", year: 2017, description: "Investigate novel crystal structures formed in microgravity." },
  { id: 14, title: "Subsurface Biosignatures on Icy Moons", piName: "Dr. Fatima Al-Zahra", institution: "Imperial College", topic: "Astrobiology", year: 2024, description: "Detecting chemical signatures for life within subsurface oceans." },
  { id: 15, title: "Dust Dynamics for Lunar Habitats", piName: "Dr. Kevin O'Leary", institution: "Colorado School of Mines", topic: "ISRU", year: 2023, description: "Characterize lunar dust and mitigation technologies for habitats." }
];

// Export for app usage (browser global)
window.BioQuestData = { projects };
