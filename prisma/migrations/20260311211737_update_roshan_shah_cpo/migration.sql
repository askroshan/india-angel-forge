-- Data migration: Replace Rajesh Iyer with Roshan Shah (Chief Product Officer)
UPDATE team_members
SET
  name         = 'Roshan Shah',
  role         = 'Chief Product Officer',
  bio          = 'Roshan Shah is a product and technology leader with 10+ years of experience in enterprise and SMB consulting. As Chief Product Officer of India Angel Forum, he drives platform innovation, product strategy, and the digital experience for investors and founders across India.',
  photo_url    = '/images/roshanshah.jpg',
  linkedin_url = 'https://www.linkedin.com/in/roshan',
  updated_at   = NOW()
WHERE name = 'Rajesh Iyer';
