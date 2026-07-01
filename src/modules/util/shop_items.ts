
export interface ShopItemData {
    category: number;
    itemId: number;
    price: number;
    shopGrade: number;
    recommended: boolean;
    isNew: boolean;
}

// รายการไอเทมตาม Shop Grade ของ WMMT 5DX PLUS
// Category: 2=Aero, 4=Bonnet, 6=Wheel, 8=Neon, 9=Trunk, 12=GT Wing, etc.
export const shopItems: ShopItemData[] = [
    // Aero Sets (Category 2)
    { category: 2, itemId: 1, price: 0, shopGrade: 1, recommended: true, isNew: false },     // Aero A
    { category: 2, itemId: 2, price: 10000, shopGrade: 4, recommended: false, isNew: false }, // Aero B
    { category: 2, itemId: 3, price: 12000, shopGrade: 8, recommended: false, isNew: false }, // Aero C
    { category: 2, itemId: 4, price: 14000, shopGrade: 22, recommended: false, isNew: false }, // Aero D
    { category: 2, itemId: 5, price: 14000, shopGrade: 28, recommended: false, isNew: false }, // Aero E
    { category: 2, itemId: 6, price: 16000, shopGrade: 33, recommended: false, isNew: false }, // Aero F
    { category: 2, itemId: 7, price: 18000, shopGrade: 39, recommended: false, isNew: false }, // Aero G
    { category: 2, itemId: 8, price: 20000, shopGrade: 47, recommended: false, isNew: false }, // Aero H
    
    // Bonnets (Category 4)
    { category: 4, itemId: 1, price: 0, shopGrade: 2, recommended: false, isNew: false },     // Carbon Bonnet
    { category: 4, itemId: 2, price: 4000, shopGrade: 5, recommended: true, isNew: false },  // FRP Bonnet A
    { category: 4, itemId: 3, price: 5000, shopGrade: 9, recommended: false, isNew: false },  // Carbon (with duct 1)
    { category: 4, itemId: 4, price: 0, shopGrade: 26, recommended: false, isNew: false },    // FRP Bonnet B
    { category: 4, itemId: 5, price: 6000, shopGrade: 33, recommended: false, isNew: false },  // FRP Bonnet C
    { category: 4, itemId: 6, price: 7000, shopGrade: 41, recommended: false, isNew: false },  // FRP Bonnet D
    { category: 4, itemId: 7, price: 8000, shopGrade: 50, recommended: false, isNew: false },  // Carbon (with duct 2)
    { category: 4, itemId: 8, price: 9000, shopGrade: 53, recommended: false, isNew: false },  // Carbon (with duct 3)

    // Wheels (Category 6) - Enkei Example
    { category: 6, itemId: 1, price: 1000, shopGrade: 2, recommended: false, isNew: false },
    { category: 6, itemId: 2, price: 1000, shopGrade: 4, recommended: false, isNew: false },
    { category: 6, itemId: 3, price: 0, shopGrade: 5, recommended: true, isNew: false },
    { category: 6, itemId: 4, price: 1200, shopGrade: 7, recommended: false, isNew: false },
    { category: 6, itemId: 5, price: 0, shopGrade: 10, recommended: false, isNew: false },
    { category: 6, itemId: 6, price: 1400, shopGrade: 12, recommended: false, isNew: false },
    { category: 6, itemId: 7, price: 1600, shopGrade: 24, recommended: false, isNew: false },
    { category: 6, itemId: 8, price: 1600, shopGrade: 26, recommended: false, isNew: false },
    { category: 6, itemId: 9, price: 0, shopGrade: 29, recommended: false, isNew: false },
    { category: 6, itemId: 10, price: 0, shopGrade: 35, recommended: false, isNew: false },
    
    // Neons (Category 8)
    { category: 8, itemId: 1, price: 0, shopGrade: 14, recommended: false, isNew: false },    // Straight Green
    { category: 8, itemId: 2, price: 4000, shopGrade: 15, recommended: false, isNew: false }, // Straight Blue
    { category: 8, itemId: 3, price: 4000, shopGrade: 16, recommended: false, isNew: false }, // Straight Purple
    { category: 8, itemId: 4, price: 5000, shopGrade: 17, recommended: false, isNew: false }, // Straight Red
    { category: 8, itemId: 5, price: 0, shopGrade: 19, recommended: false, isNew: false },    // Straight Yellow
    { category: 8, itemId: 6, price: 5000, shopGrade: 20, recommended: false, isNew: false }, // Straight Dark Purple
    
    // Trunk lid (Category 9)
    { category: 9, itemId: 1, price: 6000, shopGrade: 24, recommended: false, isNew: false }, // Carbon Trunk
];
