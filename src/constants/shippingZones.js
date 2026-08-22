import { BUSINESS_LOCATION, SITE_NAME } from '../utils/seo';

const PICKUP_LABEL = `Pick up from ${SITE_NAME} shop (${BUSINESS_LOCATION.streetAddress})`;

export const SHIPPING_ZONES = [
  {
    id: 'cbd-ngara-pangani',
    label: 'CBD, Ngara, Pangani',
    subLocations: [
      { id: 'cbd', label: 'CBD' },
      { id: 'ngara', label: 'Ngara' },
      { id: 'pangani', label: 'Pangani' },
    ],
    price: 300,
  },
  {
    id: 'westlands-parklands-highridge-citypark',
    label: 'Westlands, Parklands, Highridge, City Park',
    subLocations: [
      { id: 'westlands', label: 'Westlands' },
      { id: 'parklands', label: 'Parklands' },
      { id: 'highridge', label: 'Highridge' },
      { id: 'citypark', label: 'City Park' },
    ],
    price: 200,
  },
  {
    id: 'brookside-springvalley-peponi',
    label: 'Brookside, Spring Valley, Peponi',
    subLocations: [
      { id: 'brookside', label: 'Brookside' },
      { id: 'springvalley', label: 'Spring Valley' },
      { id: 'peponi', label: 'Peponi' },
    ],
    price: 300,
  },
  {
    id: 'hurlingham-milimani-upperhill',
    label: 'Hurlingham, Milimani, Upper Hill',
    subLocations: [
      { id: 'hurlingham', label: 'Hurlingham' },
      { id: 'milimani', label: 'Milimani' },
      { id: 'upperhill', label: 'Upper Hill' },
    ],
    price: 300,
  },
  {
    id: 'riverside-arboretum',
    label: 'Riverside Drive, Arboretum',
    subLocations: [
      { id: 'riverside', label: 'Riverside Drive' },
      { id: 'arboretum', label: 'Arboretum' },
    ],
    price: 300,
  },
  {
    id: 'kileleshwa-lavington-kilimani',
    label: 'Kileleshwa, Lavington, Kilimani',
    subLocations: [
      { id: 'kileleshwa', label: 'Kileleshwa' },
      { id: 'lavington', label: 'Lavington' },
      { id: 'kilimani', label: 'Kilimani' },
    ],
    price: 300,
  },
  {
    id: 'dagoretti-ngongroad-riara-naivasha',
    label: 'Dagoretti, Ngong Road, Riara Road, Naivasha Road',
    subLocations: [
      { id: 'dagoretti', label: 'Dagoretti' },
      { id: 'ngongroad', label: 'Ngong Road' },
      { id: 'riara', label: 'Riara Road' },
      { id: 'naivasha', label: 'Naivasha Road' },
    ],
    price: 400,
  },
  {
    id: 'muthaiga-gigiri-runda-nyari',
    label: 'Muthaiga, Gigiri, Runda, Nyari',
    subLocations: [
      { id: 'muthaiga', label: 'Muthaiga' },
      { id: 'gigiri', label: 'Gigiri' },
      { id: 'runda', label: 'Runda' },
      { id: 'nyari', label: 'Nyari' },
    ],
    price: 400,
  },
  {
    id: 'kitusuru-kyuna-loresho-lowerkabetekangemi-mountainview',
    label: 'Kitusuru, Kyuna, Loresho, Lower Kabete, Kangemi, Mountain View',
    subLocations: [
      { id: 'kitusuru', label: 'Kitusuru' },
      { id: 'kyuna', label: 'Kyuna' },
      { id: 'loresho', label: 'Loresho' },
      { id: 'lowerkabete', label: 'Lower Kabete' },
      { id: 'kangemi', label: 'Kangemi' },
      { id: 'mountainview', label: 'Mountain View' },
    ],
    price: 400,
  },
  {
    id: 'southc-southb-nairobiewest-makadara',
    label: 'South C, South B, Nairobi West, Makadara',
    subLocations: [
      { id: 'southc', label: 'South C' },
      { id: 'southb', label: 'South B' },
      { id: 'nairobiewest', label: 'Nairobi West' },
      { id: 'makadara', label: 'Makadara' },
    ],
    price: 400,
  },
  {
    id: 'trm-gardencity-kasarani-ruaraka-dandora',
    label: 'TRM, Garden City, Kasarani, Ruaraka, Dandora',
    subLocations: [
      { id: 'trm', label: 'TRM' },
      { id: 'gardencity', label: 'Garden City' },
      { id: 'kasarani', label: 'Kasarani' },
      { id: 'ruaraka', label: 'Ruaraka' },
      { id: 'dandora', label: 'Dandora' },
    ],
    price: 500,
  },
  {
    id: 'huruma-mathare-eastleigh',
    label: 'Huruma, Mathare, Eastleigh',
    subLocations: [
      { id: 'huruma', label: 'Huruma' },
      { id: 'mathare', label: 'Mathare' },
      { id: 'eastleigh', label: 'Eastleigh' },
    ],
    price: 400,
  },
  {
    id: 'industrialarea-imaradaima-embakasi',
    label: 'Industrial Area, Imara Daima, Embakasi',
    subLocations: [
      { id: 'industrialarea', label: 'Industrial Area' },
      { id: 'imaradaima', label: 'Imara Daima' },
      { id: 'embakasi', label: 'Embakasi' },
    ],
    price: 500,
  },
  {
    id: 'umoja-buruburu-nyayo-donholm-fedha-komarock',
    label: 'Umoja, Buruburu, Nyayo Estate, Donholm, Fedha Estate, Komarock',
    subLocations: [
      { id: 'umoja', label: 'Umoja' },
      { id: 'buruburu', label: 'Buruburu' },
      { id: 'nyayo', label: 'Nyayo Estate' },
      { id: 'donholm', label: 'Donholm' },
      { id: 'fedha', label: 'Fedha Estate' },
      { id: 'komarock', label: 'Komarock' },
    ],
    price: 500,
  },
  {
    id: 'langata-karen',
    label: 'Langata, Karen',
    subLocations: [
      { id: 'langata', label: 'Langata' },
      { id: 'karen', label: 'Karen' },
    ],
    price: 600,
  },
  {
    id: 'ruaka-kiambu-thindigua-gachie',
    label: 'Ruaka, Kiambu, Thindigua, Gachie',
    subLocations: [
      { id: 'ruaka', label: 'Ruaka' },
      { id: 'kiambu', label: 'Kiambu' },
      { id: 'thindigua', label: 'Thindigua' },
      { id: 'gachie', label: 'Gachie' },
    ],
    price: 600,
  },
  {
    id: 'ongata-rongai-kererapon',
    label: 'Ongata Rongai, Kererapon',
    subLocations: [
      { id: 'ongatarongai', label: 'Ongata Rongai' },
      { id: 'kererapon', label: 'Kererapon' },
    ],
    price: 800,
  },
  {
    id: 'ruiru-githurai-kahawa-utawala-juja-tatucity',
    label: 'Ruiru, Githurai, Kahawa, Utawala, Juja, Tatu City',
    subLocations: [
      { id: 'ruiru', label: 'Ruiru' },
      { id: 'githurai', label: 'Githurai' },
      { id: 'kahawa', label: 'Kahawa' },
      { id: 'utawala', label: 'Utawala' },
      { id: 'juja', label: 'Juja' },
      { id: 'tatucity', label: 'Tatu City' },
    ],
    price: 800,
  },
  {
    id: 'syokimau-athiriver-mlolongo',
    label: 'Syokimau, Athi River, Mlolongo',
    subLocations: [
      { id: 'syokimau', label: 'Syokimau' },
      { id: 'athiriver', label: 'Athi River' },
      { id: 'mlolongo', label: 'Mlolongo' },
    ],
    price: 800,
  },
  {
    id: 'kiserian-kitengela-ngongtown',
    label: 'Kiserian, Kitengela, Ngong Town',
    subLocations: [
      { id: 'kiserian', label: 'Kiserian' },
      { id: 'kitengela', label: 'Kitengela' },
      { id: 'ngongtown', label: 'Ngong Town' },
    ],
    price: 1000,
  },
  {
    id: 'jkia-kikuyu',
    label: 'JKIA Airport, Kikuyu',
    subLocations: [
      { id: 'jkia', label: 'JKIA Airport' },
      { id: 'kikuyu', label: 'Kikuyu' },
    ],
    price: 700,
  },
  {
    id: 'other-areas-courier',
    label: 'All Other Areas and Outside Nairobi - G4S, Wells Fargo, Easy Coach, Mash Courier',
    subLocations: [
      { id: 'other', label: 'Other Areas/Courier' },
    ],
    price: 600,
  },
  {
    id: 'pickup-sweech-westlands',
    label: PICKUP_LABEL,
    subLocations: [
      { id: 'pickup', label: PICKUP_LABEL },
    ],
    price: 0,
  },
];

