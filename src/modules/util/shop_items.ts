
export interface ShopItemData {
    category: number;
    itemId: number;
    price: number;
    shopGrade: number;
    recommended: boolean;
    isNew: boolean;
}

// รายการไอเทมตัวอย่าง (สามารถเพิ่มได้ตามต้องการ)
// Category: 1=Custom Color, 2=Aero, 3=Aero (Separate), 4=Bonnet, 5=Wing, 6=Wheel, 7=Mirror, 8=Neon, 9=Trunk, 10=Numberplate, 12=GT Wing, etc.
export const shopItems: ShopItemData[] = [
    // Aero Sets (Category 2)
    { category: 2, itemId: 1, price: 5000, shopGrade: 1, recommended: true, isNew: false },
    { category: 2, itemId: 2, price: 8000, shopGrade: 5, recommended: false, isNew: false },
    { category: 2, itemId: 3, price: 12000, shopGrade: 10, recommended: false, isNew: false },
    
    // Wheels (Category 6)
    { category: 6, itemId: 1, price: 2000, shopGrade: 1, recommended: false, isNew: false },
    { category: 6, itemId: 2, price: 3000, shopGrade: 3, recommended: true, isNew: false },
    { category: 6, itemId: 3, price: 4500, shopGrade: 7, recommended: false, isNew: false },
    
    // Bonnets (Category 4)
    { category: 4, itemId: 1, price: 3500, shopGrade: 4, recommended: false, isNew: false },
    { category: 4, itemId: 2, price: 6000, shopGrade: 8, recommended: true, isNew: false },
    
    // Neons (Category 8)
    { category: 8, itemId: 1, price: 4000, shopGrade: 6, recommended: false, isNew: false },
    { category: 8, itemId: 2, price: 7500, shopGrade: 12, recommended: false, isNew: false },
];
