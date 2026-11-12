import type { Rig, Employee } from '@/types';

export const RIGS: Rig[] = [
  { id: 'B2',  label: 'حفارة B2',  total: 73,  suspended: 2 },
  { id: 'B3',  label: 'حفارة B3',  total: 60,  suspended: 1 },
  { id: 'B5',  label: 'حفارة B5',  total: 1,   suspended: 0 },
  { id: 'B6',  label: 'حفارة B6',  total: 4,   suspended: 0 },
  { id: 'B7',  label: 'حفارة B7',  total: 21,  suspended: 0 },
  { id: 'B8',  label: 'حفارة B8',  total: 54,  suspended: 1 },
  { id: 'B9',  label: 'حفارة B9',  total: 68,  suspended: 1 },
  { id: 'B10', label: 'حفارة B10', total: 63,  suspended: 1 },
  { id: 'B11', label: 'حفارة B11', total: 58,  suspended: 1 },
  { id: 'FLAME', label: 'ساحة اللهيب', total: 718, suspended: 16 },
];

export const EMPLOYEES: Employee[] = [
  { id: '1', employeeNumber: '00230', name: 'المعتصم بالله محمد إبراهيم', position: 'DRIVER',       nationality: 'LIBYA',     contact: '0928766724',  rig: 'B2' },
  { id: '2', employeeNumber: '00255', name: 'مارير محمد نجيب',               position: 'TP',           nationality: 'ALGERIAN',  contact: '3670144160',  rig: 'B2' },
  { id: '3', employeeNumber: '00256', name: 'احمد المحمدي عبدالسلام الخالع', position: 'WEIDER',       nationality: 'EGYPT',     contact: '',            rig: 'B2' },
  { id: '4', employeeNumber: '00258', name: 'ادريس علي بوشناف',              position: 'RT',           nationality: 'LIBYA',     contact: '',            rig: 'B2' },
  { id: '5', employeeNumber: '00259', name: 'اسماعيل احمد إبراهيم',          position: 'DRILLER',      nationality: 'SYRIAN',    contact: '3945452136',  rig: 'B2' },
  { id: '6', employeeNumber: '00260', name: 'جابر الأحمد احميد',             position: 'ASST/DRILLER', nationality: 'SYRIAN',    contact: '',            rig: 'B2' },
  { id: '7', employeeNumber: '00261', name: 'حسن صالح حسن',                  position: 'FM',           nationality: 'LIBYA',     contact: '',            rig: 'B2' },
  { id: '8', employeeNumber: '00262', name: 'جابر محمد حسين',                position: 'ASST/DRILLER', nationality: 'LIBYA',     contact: '963941422526', rig: 'B2' },
  { id: '9', employeeNumber: '00263', name: 'حسن مفتاح حسن',                 position: 'FM',           nationality: 'LIBYA',     contact: '919870272',   rig: 'B2' },
  { id: '10', employeeNumber: '00270', name: 'خالد محمد الزروق',             position: 'DRILLER',      nationality: 'LIBYA',     contact: '0921345678',  rig: 'B3' },
  { id: '11', employeeNumber: '00271', name: 'سالم علي الورفلي',             position: 'WEIDER',       nationality: 'LIBYA',     contact: '',            rig: 'B3' },
  { id: '12', employeeNumber: '00280', name: 'أحمد فاضل الخطيب',             position: 'RT',           nationality: 'SYRIAN',    contact: '0944567890',  rig: 'B5' },
  { id: '13', employeeNumber: '00290', name: 'عمر يوسف القرضاوي',            position: 'FM',           nationality: 'EGYPT',     contact: '',            rig: 'B6' },
  { id: '14', employeeNumber: '00291', name: 'ماجد إبراهيم العجمي',          position: 'TP',           nationality: 'ALGERIAN',  contact: '0771234567',  rig: 'B6' },
  { id: '15', employeeNumber: '00300', name: 'فتحي محمد البشير',             position: 'DRIVER',       nationality: 'LIBYA',     contact: '0921098765',  rig: 'B7' }
];

export const NATIONALITIES = ['LIBYA', 'ALGERIAN', 'EGYPT', 'SYRIAN', 'TUNISIAN', 'MOROCCAN', 'OTHER'];
export const LIBYA_DESTINATIONS = ['الهيب', 'طرابلس', 'بنغازي'];
export const INTERNATIONAL_DESTINATIONS = ['تونس', 'الجزائر', 'مصر', 'سوريا'];
export const TRAVEL_MODES = [
  { id: 'road_half_fly', label: 'نصف الطريق ثم طيران' },
  { id: 'fly', label: 'طيران مباشر' },
  { id: 'car', label: 'بالسيارة' },
] as const;
export const GRADES = ['B2','B3','B5','B6','B7','B8','B9','B10','B11','ساحة اللهيب'];
