export type Promotion = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  condition: string;
  discount: string;
};

export const coffeePromotions: Promotion[] = [
  {
    id: 'birthday',
    name: 'Sinh nhật giảm 20%',
    description: 'Khách có sinh nhật trong tháng được giảm 20% hoá đơn.',
    keywords: ['sinh nhật', 'birthday'],
    condition: 'Áp dụng trong tháng sinh nhật, cần mang CCCD/CMND.',
    discount: '20%',
  },
  {
    id: 'happy-hour',
    name: 'Happy Hour 14h–16h',
    description: 'Giảm 15% cho tất cả đồ uống từ 14h đến 16h hằng ngày.',
    keywords: ['happy hour', 'happy-hour', '14h', '15h', '16h'],
    condition: 'Áp dụng từ 14h đến 16h hằng ngày.',
    discount: '15%',
  },
  {
    id: 'student',
    name: 'Học sinh – Sinh viên giảm 10%',
    description: 'Giảm 10% cho học sinh, sinh viên.',
    keywords: ['học sinh', 'sinh viên', 'student'],
    condition: 'Cần xuất trình thẻ học sinh / sinh viên.',
    discount: '10%',
  },
];