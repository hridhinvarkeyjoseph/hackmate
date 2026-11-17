import type { Hackathon } from './types'

type Seed = Omit<Hackathon, 'team' | 'tasks' | 'submission'>
import { addDays, toISODate } from './lib/date'

const offset = (days: number) => toISODate(addDays(new Date(), days))

const seeds: Seed[] = [
  {
    id: 'hm-minty-build',
    name: 'Minty Build Weekend',
    organizer: 'Hack Club',
    mode: 'Online',
    location: 'Everywhere',
    startDate: offset(10),
    endDate: offset(12),
    deadline: offset(5),
    status: 'Registered',
    prize: '$5,000',
    teamSize: 4,
    themes: ['AI', 'Developer tools', 'Design'],
    notes:
      'Ship a tiny tool that makes someone’s day a little lighter. Team is set — bring the good snacks and the wild ideas.',
    website: 'https://hackclub.com',
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-agentic-ai',
    name: 'Agentic AI Sprint',
    organizer: 'Northstar Labs',
    mode: 'Hybrid',
    location: 'Bengaluru, IN',
    startDate: offset(-2),
    endDate: offset(2),
    deadline: offset(-7),
    status: 'In progress',
    prize: '$10,000',
    teamSize: 3,
    themes: ['AI', 'Agents', 'Product'],
    notes:
      'Building a research copilot that keeps its sources in plain sight. Demo is due Sunday at 9 AM sharp.',
    website: 'https://northstarlabs.dev',
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-hack-the-north',
    name: 'Hack the North',
    organizer: 'University of Waterloo',
    mode: 'In person',
    location: 'Waterloo, CA',
    startDate: offset(32),
    endDate: offset(34),
    deadline: offset(18),
    status: 'Registered',
    prize: '$25,000',
    teamSize: 4,
    themes: ['Open innovation', 'Hardware'],
    notes:
      'Flights are booked. Need to finalise the team’s hardware kit and submit the travel reimbursement form.',
    website: 'https://hackthenorth.com',
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-pixel-purpose',
    name: 'Pixel & Purpose',
    organizer: 'Designers Guild',
    mode: 'Online',
    location: 'Remote',
    startDate: offset(47),
    endDate: offset(48),
    deadline: offset(32),
    status: 'Idea',
    prize: '$2,000',
    teamSize: 2,
    themes: ['Climate', 'UX', 'Social good'],
    notes:
      'A gentle nudge app for neighbourhood composting. Still sketching the flow and looking for a frontend partner.',
    website: 'https://designersguild.co',
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-campus-codefest',
    name: 'Campus Codefest',
    organizer: 'IIT Madras',
    mode: 'In person',
    location: 'Chennai, IN',
    startDate: offset(-20),
    endDate: offset(-18),
    deadline: offset(-32),
    status: 'Won',
    prize: '₹1,00,000',
    teamSize: 4,
    themes: ['Fintech', 'Accessibility'],
    notes:
      'Took home Best Fintech Hack for Pennywise, a voice-first budgeting app for first-time earners.',
    website: 'https://iitm.ac.in',
    favorite: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-greenhack',
    name: 'GreenHack',
    organizer: 'Earth Collective',
    mode: 'Hybrid',
    location: 'Berlin, DE',
    startDate: offset(-48),
    endDate: offset(-46),
    deadline: offset(-61),
    status: 'Completed',
    prize: '$8,000',
    teamSize: 4,
    themes: ['Sustainability', 'Data'],
    notes:
      'Made it to the finals with a live carbon map for local supply chains. A brilliant team, a long train home.',
    website: 'https://earthcollective.org',
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-shipathon',
    name: 'Ship-a-thon 04',
    organizer: 'Buildspace',
    mode: 'Online',
    location: 'Remote',
    startDate: offset(-13),
    endDate: offset(-11),
    deadline: offset(-20),
    status: 'Submitted',
    prize: '$3,000',
    teamSize: 2,
    themes: ['SaaS', 'No-code'],
    notes:
      'Submitted Loomly — a 30-second screen recorder for product teams. Currently waiting on judging.',
    website: 'https://buildspace.so',
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-localhost',
    name: 'Localhost LDN',
    organizer: 'Makers Club',
    mode: 'In person',
    location: 'London, UK',
    startDate: offset(20),
    endDate: offset(21),
    deadline: offset(14),
    status: 'Registered',
    prize: '£4,000',
    teamSize: 3,
    themes: ['Community', 'Civic tech'],
    notes:
      'One weekend to make the high street feel a little more human. Applying with a local events map.',
    website: 'https://makersclub.london',
    favorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hm-tiny-tools',
    name: 'Tiny Tools Jam',
    organizer: 'Indie Hackers',
    mode: 'Online',
    location: 'Remote',
    startDate: offset(63),
    endDate: offset(64),
    deadline: offset(49),
    status: 'Idea',
    prize: '$1,500',
    teamSize: 2,
    themes: ['Micro SaaS', 'Productivity'],
    notes:
      'A one-weekend challenge to build the smallest useful thing possible. Thinking about a focus timer with a garden.',
    website: 'https://indiehackers.com',
    favorite: false,
    createdAt: new Date().toISOString(),
  },

]

const extras: Record<string, Partial<Pick<Hackathon, 'team' | 'tasks' | 'submission'>>> = {
  'hm-minty-build': {
    team: [
      { id: 'm1', name: 'Priya', role: 'Design' },
      { id: 'm2', name: 'Sam', role: 'Frontend' },
    ],
    tasks: [
      { id: 't1', label: 'Register the team', done: true },
      { id: 't2', label: 'Sketch the demo flow', done: false },
      { id: 't3', label: 'Record a 60s demo', done: false },
    ],
  },
  'hm-agentic-ai': {
    team: [{ id: 'm3', name: 'Ravi', role: 'Backend' }],
    tasks: [
      { id: 't4', label: 'Wire up the retrieval layer', done: true },
      { id: 't5', label: 'Prepare the judging pitch', done: false },
    ],
    submission: { repo: 'https://github.com/example/research-copilot', demo: '', video: '' },
  },
}

const defaults = {
  team: [] as Hackathon['team'],
  tasks: [] as Hackathon['tasks'],
  submission: { repo: '', demo: '', video: '' } as Hackathon['submission'],
}

export const sampleHackathons: Hackathon[] = seeds.map((seed) => ({
  ...seed,
  ...defaults,
  ...extras[seed.id],
}))

