import puppeteer, { Browser, Page } from "puppeteer";

export const crawlCategoryOfShop = async (
  page: Page,
  shop_link: string,
  shop_name: string
) => {
  try {
    // await page.goto("https://shopee.vn/buyer/login");

    // // Chờ trang đăng nhập xuất hiện
    // await page.waitForSelector('input[name="loginKey"]');

    // // Điền thông tin đăng nhập
    // await page.type('input[name="loginKey"]', "0356536723");
    // await page.type('input[name="password"]', "Yasuobeep@2003");
    // await page.waitForTimeout(2000);

    // await page.evaluate(() => {
    //   const button: any = document.querySelector(".wyhvVD");
    //   button.click();
    // });

    // await page.waitForNavigation();

    const avatar = await page.waitForSelector(".shopee-avatar");

    if (avatar) {
      const arrayCategory = [];
      await page.goto(shop_link);
      await page.waitForTimeout(5000);

      const categoryElements = await page.$$(".zvVwjQ");

      for (const categoryElement of categoryElements) {
        const categoryName = await categoryElement.evaluate((element) =>
          element.textContent?.trim()
        );
        const categoryData = {
          title: categoryName,
          shop_name: shop_name,
        };

        arrayCategory.push(categoryData);
      }

      return arrayCategory;
    }
  } catch (err) {
    console.error(err);
  }
};
