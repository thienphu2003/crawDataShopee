const axios = require("axios");

export const crawCategoryOfShop = (
  shopId: string,
  token?: string,
  cookie?: string, // Complete your cookie value here
  userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
) => {
  return new Promise(async (resolve, reject) => {
    let categoryName: string[] = [];
    try {
      const response = await axios.get(
        `https://shopee.vn/api/v4/shop/get_categories?limit=20&offset=0&shopid=${shopId}&two_tier_cate=1&version=2`,
        {
          headers: {
            "User-Agent": userAgent || "",
            Cookie: cookie,
            Authorization: token || "",
          },
        }
      );

      const shop_categories: string = JSON.stringify(response.data);
      const jsonObject = JSON.parse(shop_categories);

      if (jsonObject.data && jsonObject.data.shop_categories) {
        const categories = jsonObject.data.shop_categories;
        const displayNames = categories.map(
          (category: { display_name: any }) => category.display_name
        );

        categoryName = displayNames;
      } else {
        // Trường hợp shop_categories là undefined
        categoryName = []; // Hoặc bạn có thể trả về giá trị mặc định khác tùy ý
      }

      resolve(categoryName);
    } catch (err: any) {
      console.log(err);
      resolve(categoryName);
    }
  });
};
