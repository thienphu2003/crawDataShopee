import { Browser } from "puppeteer";
import { crawCategoryOfShop } from "./crawCategoryOfShopAPI";

const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   await page.goto("https://shopee.vn/buyer/login");

//   // Chờ trang đăng nhập xuất hiện
//   await page.waitForSelector('input[name="loginKey"]');

//   // Điền thông tin đăng nhập
//   await page.type('input[name="loginKey"]', "0356536723");
//   await page.type('input[name="password"]', "Yasuobeep@2003");
//   await page.waitForTimeout(3000);

//   await page.evaluate(() => {
//     const button: any = document.querySelector(".wyhvVD");
//     button.click();
//   });

//   const avatar = await page.waitForSelector(".shopee-avatar");

//   if (!avatar) {
//     console.log("Không tìm thấy avatar");
//     // await browser.close()
//   } else {
//     await page.goto("https://shopee.vn/sp.btw2");
//     const devTools = await page.target().createCDPSession();
//     await devTools.send("Network.enable");

//     const shopIds: string[] = [];

//     devTools.on("Network.requestWillBeSent", (event: any) => {});

//     devTools.on("Network.responseReceived", (event: any) => {
//       const url = event.response.url;
//       if (url.includes("https://shopee.vn/api/v4/shop/get_categories")) {
//         const urlSearchParams = new URLSearchParams(url);
//         const shopId = urlSearchParams.get("shopid");
//         if (shopId) {
//           shopIds.push(shopId);
//         }
//       }
//     });

//     setTimeout(async () => {
//       console.log(shopIds);
//       const cookies = await page.cookies();
//       const combinedCookie = cookies
//         .map(
//           (cookie: { name: any; value: any }) =>
//             `${cookie.name}=${cookie.value}`
//         )
//         .join("; ");
//       console.log(combinedCookie);
//       const result = await crawCategoryOfShop(
//         shopIds[0],
//         combinedCookie,
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
//       );
//       console.log(result);
//     }, 10000);
//   }
// })();

export const crawlDataCategoryOfShop = (browser: Browser, url: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const page = await browser.newPage();
      let token: string = "";

      await page.goto(url);

      const devTools = await page.target().createCDPSession();
      await devTools.send("Network.enable");

      const shopIds: string[] = [];

      devTools.on("Network.responseReceived", (event: any) => {
        const url = event.response.url;
        if (
          url.includes("https://shopee.vn/api/v4/shop/get_categories") ||
          url.includes("shopid")
        ) {
          const urlSearchParams = new URLSearchParams(url);
          const shopId = urlSearchParams.get("shopid");
          if (shopId) {
            shopIds.push(shopId);
          }
        }
      });

      setTimeout(async () => {
        const cookies = await page.cookies();

        const combinedCookie = cookies
          .map(
            (cookie: { name: any; value: any }) =>
              `${cookie.name}=${cookie.value}`
          )
          .join("; ");
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 2000);
        });
        const result = await crawCategoryOfShop(
          shopIds[0],
          "",
          combinedCookie,
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        );
        if (result === null) {
          resolve(null);
          return;
        }
        resolve(result);
        await page.close();
      }, 5000);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};
