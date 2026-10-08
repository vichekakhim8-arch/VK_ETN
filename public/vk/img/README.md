# VK_ETN — store image folder

All website images are plain files in this folder (no backend, no database).

| Folder | Used for | Example path in the dashboard |
|---|---|---|
| `products/`   | product photos (`<productId>-<n>.jpg`) | `/vk/img/products/p1-1.jpg` |
| `categories/` | category tiles (`<categoryId>.jpg`)    | `/vk/img/categories/phones.jpg` |
| `banners/`    | hero slides, promo banner, login image  | `/vk/img/banners/hero.jpg` |
| `uploads/`    | put your own new images here            | `/vk/img/uploads/my-photo.jpg` |

## Add a new image
1. Copy the file into one of the folders above (for example `uploads/`).
2. Add the file name to `manifest.json` under the same folder name, so it appears in
   **Dashboard → Products → Choose from folder**.
3. Or type the path directly into any image field, e.g. `/vk/img/uploads/my-photo.jpg`.

Images uploaded from the dashboard with the **Upload** button are compressed and saved
inside the browser database (they do not create files here, because there is no server).
