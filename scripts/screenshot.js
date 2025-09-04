import puppeteer, { KnownDevices } from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BASE_URL = 'http://localhost:5173/fuel'; // 修改为您实际使用的端口

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    devtools: true, // 自动打开 DevTools
  });

  try {
    const page = await browser.newPage();
    // 设置设备模拟
    await page.emulate(KnownDevices['iPhone 12 Pro'])
    
    // 历史页面截图
    await page.goto(`${BASE_URL}/`);
    await wait(2000); // 等待页面加载
    await page.screenshot({
      path: path.join(__dirname, '../docs/assets/home.png'),
      fullPage: false, // 只截取视口部分
    });

    // 统计页面截图
    await page.goto(`${BASE_URL}/#/chart`);
    await wait(2000); // 等待页面加载
    await page.screenshot({
      path: path.join(__dirname, '../docs/assets/chart.png'),
      fullPage: false, // 只截取视口部分
    });

    // 偏好页面截图
    await page.goto(`${BASE_URL}/#/preference`);
    await wait(2000); // 等待页面加载
    await page.screenshot({
      path: path.join(__dirname, '../docs/assets/settings.png'),
      fullPage: false, // 只截取视口部分
    });

    // 记录页面截图
    await page.goto(`${BASE_URL}/`);
    await wait(2000); // 等待页面加载
    await page.evaluate((...args) => {
      const addButton = document.querySelector('.tab-bar button.float-button');
      if (addButton) {
        addButton.click();
      }
    });
    await wait(1000); // 等待表单显示
    await page.screenshot({
      path: path.join(__dirname, '../docs/assets/record.png'),
      fullPage: false, // 只截取视口部分
    });

    console.log('所有截图已完成！');
  } catch (error) {
    console.error('截图过程中出错：', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots(); 