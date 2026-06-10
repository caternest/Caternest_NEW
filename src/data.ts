import { Caterer, LocationOption, Review } from './types';

export const HYDERABAD_AREAS: LocationOption[] = [
  { id: '1', name: 'Banjara Hills' },
  { id: '2', name: 'Jubilee Hills' },
  { id: '3', name: 'Kukatpally' },
  { id: '4', name: 'Gachibowli' },
  { id: '5', name: 'Hitech City' },
  { id: '6', name: 'Kondapur' },
  { id: '7', name: 'Madhapur' },
  { id: '8', name: 'Miyapur' },
  { id: '9', name: 'Manikonda' },
  { id: '10', name: 'Narsingi' },
  { id: '11', name: 'Begumpet' },
  { id: '12', name: 'Secunderabad' },
  { id: '13', name: 'Charminar' },
  { id: '14', name: 'LB Nagar' },
  { id: '15', name: 'Uppal' },
];

export const DEMO_CATERERS: Caterer[] = [];

export const DEMO_REVIEWS: Review[] = [
  {
    id: 'r1',
    catererId: 'c1',
    authorName: 'Rahul V.',
    authorImage: 'https://i.pravatar.cc/150?u=1',
    rating: 5,
    content: 'Absolutely brilliant food! The Biryani was exactly how we wanted it for our wedding reception. Highly recommend The South Venue.',
    date: '2 months ago'
  },
  {
    id: 'r2',
    catererId: 'c2',
    authorName: 'Sita Reddy',
    authorImage: 'https://i.pravatar.cc/150?u=2',
    rating: 5,
    content: 'Perfect traditional Andhra spread for our housewarming. The pulihora and sweets were a massive hit among the guests.',
    date: '1 week ago'
  },
  {
    id: 'r3',
    catererId: 'c1',
    authorName: 'Vikram S.',
    authorImage: 'https://i.pravatar.cc/150?u=3',
    rating: 4.5,
    content: 'Great service and extremely professional team. The starters were going around continuously. Overall a premium experience.',
    date: '3 months ago'
  }
];
