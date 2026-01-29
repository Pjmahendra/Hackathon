// Fixed pricing for each job type (must match client-side pricing)
export const JOB_PRICING = {
  Cleaning: 100,
  Electrician: 200,
  Plumbing: 150,
  Carpentry: 180,
  Painting: 120,
  Gardening: 90,
  Moving: 250,
  Other: 100
};

// Get price for a job type
export const getJobPrice = (jobName) => {
  return JOB_PRICING[jobName] || JOB_PRICING.Other;
};
