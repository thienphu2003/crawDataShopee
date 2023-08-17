import puppeteer, { Browser, Page } from "puppeteer";

export const crawlProduct = async (page: Page, shop_link: string) => {
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
      let arrayProducts = [];
      await page.goto(shop_link);
      await page.waitForTimeout(5000);

      const categoryElements = await page.$$(".zvVwjQ");

      for (const categoryElement of categoryElements) {
        const categoryName = await categoryElement.evaluate((element) =>
          element.textContent?.trim()
        );

        await categoryElement.click();
        await page.waitForTimeout(2000);

        const productContainers = await page.$$(
          ".shop-search-result-view__item"
        );

        for (const productContainer of productContainers) {
          const nameElement = await productContainer.$(".h0HBrE");
          const priceElement = await productContainer.$(".Fd5u2V ._0ZJOIv");
          const linkElement = await productContainer.$("a[data-sqe='link']");
          const imageElement = await productContainer.$(".yg8VCe");

          if (nameElement && priceElement && linkElement && imageElement) {
            const productName = await nameElement.evaluate((element) =>
              element.textContent?.trim()
            );
            const productPrice = await priceElement.evaluate((element) =>
              element.textContent?.trim()
            );
            const productLink = await linkElement.evaluate((element) =>
              element.getAttribute("href")
            );
            const productImage = await imageElement.evaluate((element) =>
              element.getAttribute("src")
            );

            const productData = {
              category: categoryName,
              name: productName,
              price: productPrice,
              link: "https://shopee.vn" + productLink,
              image: productImage,
            };

            arrayProducts.push(productData);
          }
        }
      }

      return arrayProducts;
    }
  } catch (err) {
    console.error(err);
  }
};
