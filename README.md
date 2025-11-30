# 🎬 CineFind – Movie Discovery & Recommendation App

CineFind is a movie recommendation and search application that allows users to discover movies by keyword, genre, and year. It uses the **OMDb API** to fetch real-time movie data and includes features such as:
- Movie search  
- Popular movie suggestions  
- Detailed movie info  
- Wishlist feature  
- Movie discovery by year  
- Fully deployed using **PM2**, **Nginx**, and **Load Balancing** across multiple servers

Live Application (Load Balanced):  
**http://3.86.214.127/**

---

## 🚀 Features

### 🔍 Search Movies  
Search for movies by any keyword (title, actor, plot keyword, etc.).

### ⭐ Popular Movies  
Automatically generates a set of popular movies using smart random keywords.

### 🎞 Movie Details  
View full movie details including rating, plot, cast, director, and more.

### 📅 Movies by Year  
Browse movies released in a specific year.

### ❤️ Wishlist  
Save your favorite movies to your wishlist (client-side).

### 🏥 Health Check  
Simple API endpoint to check if the backend is alive.

---

## 🖥️ Tech Stack

### Backend
- Node.js
- Express.js
- Axios

### Frontend
- HTML, CSS, JavaScript (static files served by Express)

### Deployment
- PM2 (process manager)
- Nginx as reverse-proxy
- Load balancer server (lb01)
- Two web servers (web01, web02)

---

## 📡 API Endpoints

### Home Route  
Returns frontend UI.
```
GET /
```

### Search Movies  
```
GET /api/movies/search?q=keyword&page=1
```

### Movie Details  
```
GET /api/movie/:id
```

### Popular Movies  
```
GET /api/movies/popular
```

### Movies by Year  
```
GET /api/movies/year/:year
```

### Health Check  
```
GET /health
```

---

## 🛠️ Installation (Local Development)

### 1️⃣ Install NVM & Node.js
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 20
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 2️⃣ Clone the repository
```
git clone https://github.com/Christian-pprogrammer/cinefind.git
cd cinefind
```

### 3️⃣ Install dependencies
```
npm install
```

### 4️⃣ Add OMDb API Key
Create `.env`:
```
OMDB_API_KEY=omdb_api_key
```

### 5️⃣ Run the server
```
node server.js
```

Server runs on **http://localhost:3000**

You can also specify your own PORT in `.env`
---

## 🚢 Production Deployment

Production uses:

- **web01** → `3.82.199.212`
- **web02** → `3.88.169.247`
- **lb01** → `3.86.214.127` (Load Balancer)

### 1️⃣ Cloned my app to both web servers

```
ssh ubuntu@3.82.199.212
cd /var/www && git clone https://github.com/Christian-pprogrammer/cinefind.git
cd cinefind
```

```
ssh ubuntu@3.88.169.247
cd /var/www && git clone https://github.com/Christian-pprogrammer/cinefind.git
cd cinefind
```

### 2️⃣ Started the app using PM2 on each web server
```
pm2 stop all
pm2 start server.js --name cinefind
pm2 save
pm2 startup
```

### 3️⃣ Set up Nginx Reverse Proxy on lb server

```
ssh ubuntu@3.86.214.127
sudo apt-get install nginx -y

Edit the file `/etc/nginx/sites-available/default` to setup loadbalanced nginx
```
upstream node_backend {
    server 3.82.199.212:3000;
    server 3.88.169.247:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://node_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable config:
```
sudo systemctl restart nginx
```

```
/cinefind
│── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│── server.js
│── .env
│── package.json
│── README.md
```

---

---

## ✔️ Conclusion

My CineFind app is:
- Fully deployed  
- Load balanced  
- Running with PM2  
- Frontend + backend fully functional  
- Production-ready  