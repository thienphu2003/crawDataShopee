import puppeteer, { Browser, Page } from "puppeteer";
import { crawlDataCategoryOfShop } from "./test";
import { crawlProduct } from "./crawProducts";
import { crawlCategoryOfShop } from "./crawCategoryOfShop";

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

interface Category {
  link: string;
  content: string;
  image: string;
}

interface Shop {
  name: string;
  shop_link: string;
  logo: string;
  category: string;
}

interface CategoryOfShop {
  title: string;
  shop_name: string;
}

interface Product {
  category: string;
  name: string;
  price: string;
  image: string;
}

let data: {
  category: Category[];
  shop: Shop[];
  categoryOfShop: CategoryOfShop[];
  products: Product[][];
} = { category: [], shop: [], categoryOfShop: [], products: [] }; // All Data

class CrawlData {
  constructor() {}

  // async crawlDataChunk(data: any, array: any[], browser: Browser) {
  //   for (let i = 0; i < array.length; i++) {
  //     let ShopLink = data.shop[i].shop_link;

  //     let listCategoryOfShop = (await this.crawlCategoryOfShop(
  //       browser,
  //       ShopLink
  //     )) as CategoryOfShop[];
  //     if (listCategoryOfShop === null || undefined) {
  //       break;
  //     }
  //     data.categoryOfShop.push(listCategoryOfShop);
  //   }
  //   return data;
  // }

  crawlCategoryOfShop = (browser: Browser, url: string) =>
    new Promise(async (resolve, reject) => {
      try {
        let result = (await crawlDataCategoryOfShop(browser, url)) as string[];
        if (result === null) {
          resolve(null);
          return;
        }
        let data = result.map((category, index) => {
          return {
            title: category,
          };
        });

        resolve(data);
      } catch (error) {
        reject(`Error in crawl category of shop: ${error}`);
      }
    });

  crawlCategory = (page: Page, url: string) =>
    new Promise(async (resolve, rejects) => {
      try {
        await page.goto(url);
        await page.waitForTimeout(10000);

        let data = await page.evaluate(() => {
          let els = document.querySelectorAll(".Hs-Gh5");
          let resultArray: any[] = [];

          els.forEach((el) => {
            let aTag = el as HTMLAnchorElement;
            let divTag1 = el.querySelector(".ZueS1J") as HTMLDivElement;
            let divTag2 = el.querySelector(
              ".yvbeD6 .MXFMLN.vc8g9F"
            ) as HTMLDivElement;

            let imageData = divTag2 ? divTag2.getAttribute("style") : "";
            const imageUrlMatch = imageData?.match(
              /url\(['"]?([^'")]+)['"]?\)/
            );
            const imageUrl = imageUrlMatch
              ? imageUrlMatch[1]
              : "Do not have image url";

            if (imageUrl) {
              resultArray.push({
                link: aTag?.href,
                content: divTag1?.textContent,
                image: imageUrl,
              });
            }
          });

          return resultArray;
        });

        // console.log(data);
        resolve(data);
      } catch (error) {
        rejects(`error in crawl category: ${error})`);
      }
    });

  crawlShop = (page: Page, url: string) =>
    new Promise(async (resolve, rejects) => {
      try {
        await page.goto(url);
        await page.waitForTimeout(10000);
        await page.waitForSelector(".full-brand-list-item__brand-cover-image");

        let shopData = await page.$$eval(
          ".full-brand-list-item__brand-cover-image",
          (els) => {
            let resultArray: any[] = [];

            resultArray = els.map((el) => {
              let aTag = el as HTMLAnchorElement;
              let divTag = el.querySelector(
                ".full-brand-list-item__brand-name"
              ) as HTMLDivElement;
              let divTag2 = el.querySelector(
                ".full-brand-list-item__cover-image.sffSbe"
              ) as HTMLDivElement;
              return {
                name: divTag.innerText,
                shop_link: aTag.href,
                logo:
                  (divTag2 ? divTag2.getAttribute("style")!! : "").match(
                    /url\(['"]?([^'")]+)['"]?\)/
                  )?.[1] || "",
              };
            });
            return resultArray;
          }
        );

        resolve(shopData);
      } catch (error) {
        rejects(`error in crawl shop: ${error}`);
      }
    });

  async crawlController() {
    try {
      let browser: Browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true,
      });

      let page = await browser.newPage();

      await page.goto("https://shopee.vn/buyer/login");

      // Chờ trang đăng nhập xuất hiện
      await page.waitForSelector('input[name="loginKey"]');

      // Điền thông tin đăng nhập
      await page.type('input[name="loginKey"]', "0356536723");
      await page.type('input[name="password"]', "Yasuobeep@2003");
      await page.waitForTimeout(2000);

      await page.evaluate(() => {
        const button: any = document.querySelector(".wyhvVD");
        button.click();
      });
      await page.waitForNavigation();

      const avatar = await page.waitForSelector(".shopee-avatar");

      // main category
      if (!avatar) {
        await browser.close();
        console.log("Khong tim thay avatar");
      }

      let url = "https://shopee.vn/all_categories";
      let category = "";

      let listCategory = (await this.crawlCategory(page, url)) as Category[];
      data.category.push(...listCategory);

      for (const item of listCategory) {
        let parts = item.link.split(".");
        let tempUrl = parts[parts.length - 1];
        let url = "https://shopee.vn/mall/brands/" + tempUrl;
        category = item.content;

        // shop
        let listShop = (await this.crawlShop(page, url)) as Shop[];
        for (const shop of listShop) {
          shop.category = item.content;
        }
        data.shop.push(...listShop);
      }

      for (let i = 0; i < data.shop.length; i++) {
        if (data.shop[i].shop_link.includes("search")) {
          data.shop[i].shop_link = "";
        }
      }

      data.shop = data.shop.filter(
        (item) => item.shop_link !== "" && item.logo !== ""
      );
      data.category = data.category.filter(
        (item) => item.image !== "Do not have image url"
      );

      if (data.shop.length > 0) {
        for (let i = 0; i < 10; i++) {
          let ShopLink = data.shop[i].shop_link;
          let ShopName = data.shop[i].name;

          let listCategoryOfShop = (await crawlCategoryOfShop(
            page,
            ShopLink,
            ShopName
          )) as CategoryOfShop[];

          // if (listCategoryOfShop === null) {
          //   fs.writeFile("data.json", JSON.stringify(data), (err: any) => {
          //     if (err) console.log("write data fail");
          //     console.log("write data successfully");
          //   });
          //   return;
          // }

          data.categoryOfShop.push(...listCategoryOfShop);
        }
      } else {
        console.log("No shops found in the data.");
      }

      for (let i = 0; i < 10; i++) {
        let productsOfShop = (await crawlProduct(
          page,
          data.shop[i].shop_link
        )) as Product[];
        data.products.push(productsOfShop);
      }

      fs.writeFile("data.json", JSON.stringify(data), (err: any) => {
        if (err) console.log("write data fail");
        console.log("write data successfully");
      });

      await page.close();

      await browser.close();
    } catch (error) {
      fs.writeFile("data.json", JSON.stringify(data), (err: any) => {
        if (err) console.log("write data fail");
        console.log("write data successfully");
      });
      console.log(`error in crawl controller: ${error}`);
    }
  }
}

(async () => {
  let crawlData = new CrawlData();
  await crawlData.crawlController();
})();
