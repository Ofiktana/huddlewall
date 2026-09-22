function iso(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

export function seedState() {
  return {
    buckets: [
      {
        id: 'b_offsite',
        name: 'Q4 Team Offsite Ideas',
        code: 'OFFSITE24',
        createdAt: iso(240),
        posts: [
          {
            id: 'p_offsite_1',
            author: 'Amara',
            token: 'seed_amara',
            text: 'Half-day at the Lekki conservation centre, then a shared lunch nearby.',
            color: '#FFD93D',
            createdAt: iso(220),
            updatedAt: iso(220),
          },
          {
            id: 'p_offsite_2',
            author: 'Chidi',
            token: 'seed_chidi',
            text: 'Skills swap afternoon — everyone teaches a 20 min mini-class on something they know.',
            color: '#4CC9F0',
            createdAt: iso(190),
            updatedAt: iso(190),
          },
          {
            id: 'p_offsite_3',
            author: 'Ngozi',
            token: 'seed_ngozi',
            text: 'Keep it low-key this quarter: board games + food trucks at the office rooftop.',
            color: '#2EC4B6',
            createdAt: iso(150),
            updatedAt: iso(150),
          },
          {
            id: 'p_offsite_4',
            author: 'Femi',
            token: 'seed_femi',
            text: 'Volunteer morning at a local school, offsite lunch after.',
            color: '#FF6F91',
            createdAt: iso(95),
            updatedAt: iso(95),
          },
          {
            id: 'p_offsite_5',
            author: 'Amara',
            token: 'seed_amara',
            text: 'Whatever we pick, please not another escape room 😅',
            color: '#A78BFA',
            createdAt: iso(40),
            updatedAt: iso(40),
          },
        ],
      },
      {
        id: 'b_feature',
        name: 'Mobile App — New Feature Brainstorm',
        code: 'FEATURE01',
        createdAt: iso(180),
        posts: [
          {
            id: 'p_feature_1',
            author: 'Tunde',
            token: 'seed_tunde',
            text: 'Offline mode for the field team — cache the last synced dataset.',
            color: '#FF9F1C',
            createdAt: iso(160),
            updatedAt: iso(160),
          },
          {
            id: 'p_feature_2',
            author: 'Bola',
            token: 'seed_bola',
            text: 'One-tap daily production log with smart defaults from yesterday.',
            color: '#4CC9F0',
            createdAt: iso(120),
            updatedAt: iso(120),
          },
          {
            id: 'p_feature_3',
            author: 'Chidi',
            token: 'seed_chidi',
            text: 'Push alert when a reading drifts outside the normal range.',
            color: '#FFD93D',
            createdAt: iso(70),
            updatedAt: iso(70),
          },
        ],
      },
    ],
  };
}
