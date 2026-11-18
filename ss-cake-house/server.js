require("dotenv").config();
const express=require("express"), session=require("express-session"), helmet=require("helmet");
const fs=require("fs"), path=require("path"), multer=require("multer"), nodemailer=require("nodemailer"), bcrypt=require("bcryptjs");
const app=express(), PORT=process.env.PORT||3000, DATA=path.join(__dirname,"data"), UP=path.join(__dirname,"public","uploads");
[DATA,UP].forEach(p=>fs.mkdirSync(p,{recursive:true}));
const dbFile=path.join(DATA,"store.json");
const initial={settings:{businessName:"S&S Cake House",tagline:"A little sweetness, a lot of love.",phone:"+94 77 000 0000",email:"hello@sscakehouse.lk",address:"Puttalam, Sri Lanka",instagram:"https://instagram.com/",whatsapp:"+94770000000",deliveryNote:"Delivery available in selected areas. Contact us to confirm."},products:[
{id:1,name:"Blush Rose Celebration",category:"Birthday",price:8500,description:"Vanilla sponge, silky buttercream and delicate blush-pink florals.",image:"https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1000&q=85",featured:true,active:true},
{id:2,name:"Strawberry Dream",category:"Signature",price:7200,description:"Soft vanilla layers with strawberry cream and fresh berry finish.",image:"https://images.unsplash.com/photo-1567261839296-cb6c3f4b2b9a?auto=format&fit=crop&w=1000&q=85",featured:true,active:true},
{id:3,name:"Pearl Wedding Cake",category:"Wedding",price:28500,description:"Elegant tiered design with pearl details. Custom sizes available.",image:"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85",featured:true,active:true},
{id:4,name:"Chocolate Luxe",category:"Chocolate",price:9500,description:"Rich chocolate sponge, ganache and a luxurious finish.",image:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85",featured:false,active:true},
{id:5,name:"Pastel Party Cake",category:"Birthday",price:6800,description:"A joyful pastel buttercream cake made for celebrations.",image:"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85",featured:false,active:true},
{id:6,name:"Mini Bento Love",category:"Mini Cakes",price:3200,description:"A sweet little bento cake with your own message.",image:"https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=1000&q=85",featured:false,active:true}
],orders:[]};
if(!fs.existsSync(dbFile))fs.writeFileSync(dbFile,JSON.stringify(initial,null,2));
const read=()=>JSON.parse(fs.readFileSync(dbFile)); const write=d=>fs.writeFileSync(dbFile,JSON.stringify(d,null,2));
app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:"2mb"})); app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"change-this-session-secret",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
app.use(express.static(path.join(__dirname,"public")));
const admin=(req,res,next)=>req.session.admin?next():res.status(401).json({error:"Please sign in again."});
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,UP),filename:(req,file,cb)=>cb(null,Date.now()+"-"+Math.random().toString(36).slice(2)+path.extname(file.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))});
app.get("/api/store",(req,res)=>{const d=read();res.json({settings:d.settings,products:d.products.filter(p=>p.active)});});
app.post("/api/orders",async(req,res)=>{
 try{
 const {customer,phone,email,address,date,time,items,message}=req.body;
 if(!customer||!phone||!address||!date||!Array.isArray(items)||!items.length) return res.status(400).json({error:"Please complete all required order details."});
 const d=read(); let lines=[],total=0;
 for(const item of items){const p=d.products.find(x=>x.id===Number(item.id)&&x.active);const qty=Math.max(1,Math.min(20,Number(item.qty)||1));if(!p)continue;lines.push({id:p.id,name:p.name,price:p.price,qty});total+=p.price*qty;}
 if(!lines.length)return res.status(400).json({error:"Your cart is empty or contains unavailable items."});
 const order={id:"SS"+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),customer,phone,email:email||"",address,date,time:time||"",message:message||"",items:lines,total,status:"New"};
 d.orders.unshift(order);write(d);
 let emailSent=false;
 if(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS&&process.env.ORDER_EMAIL){
  try{const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:String(process.env.SMTP_SECURE)!=="false",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  await transporter.sendMail({from:process.env.SMTP_USER,to:process.env.ORDER_EMAIL,replyTo:email||undefined,subject:`New cake order ${order.id} - ${customer}`,text:`NEW ORDER ${order.id}\nCustomer: ${customer}\nPhone: ${phone}\nEmail: ${email}\nAddress: ${address}\nDate: ${date} ${time}\n\n${lines.map(x=>`${x.qty} x ${x.name} - LKR ${(x.price*x.qty).toLocaleString("en-LK")}`).join("\n")}\nTOTAL: LKR ${total.toLocaleString("en-LK")}\nMessage: ${message}`});emailSent=true;
  }catch(e){console.error("Order email failed:",e.message);}
 }
 res.json({ok:true,orderId:order.id,emailSent});
 }catch(e){console.error(e);res.status(500).json({error:"Could not place order. Please try again."});}
});
app.post("/api/admin/login",async(req,res)=>{const {username,password}=req.body;const hash=process.env.ADMIN_PASSWORD_HASH; if(!hash||username!== (process.env.ADMIN_USERNAME||"owner")||!await bcrypt.compare(password||"",hash))return res.status(401).json({error:"Incorrect login. Check your .env settings."});req.session.admin=true;res.json({ok:true});});
app.post("/api/admin/logout",admin,(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/data",admin,(req,res)=>res.json(read()));
app.put("/api/admin/settings",admin,(req,res)=>{const d=read();d.settings={...d.settings,...req.body};write(d);res.json({ok:true});});
app.post("/api/admin/products",admin,(req,res)=>{const d=read();const p={...req.body,id:Date.now(),price:Number(req.body.price)||0,active:true,featured:!!req.body.featured};d.products.unshift(p);write(d);res.json(p);});
app.put("/api/admin/products/:id",admin,(req,res)=>{const d=read(),i=d.products.findIndex(p=>p.id===Number(req.params.id));if(i<0)return res.status(404).json({error:"Product not found"});d.products[i]={...d.products[i],...req.body,price:Number(req.body.price)||0};write(d);res.json(d.products[i]);});
app.delete("/api/admin/products/:id",admin,(req,res)=>{const d=read();d.products=d.products.filter(p=>p.id!==Number(req.params.id));write(d);res.json({ok:true});});
app.post("/api/admin/upload",admin,upload.single("photo"),(req,res)=>{if(!req.file)return res.status(400).json({error:"Please choose an image (JPG, PNG, WEBP or GIF, max 5MB)."});res.json({url:"/uploads/"+req.file.filename});});
app.put("/api/admin/orders/:id",admin,(req,res)=>{const d=read(),o=d.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:"Order not found"});o.status=req.body.status;write(d);res.json({ok:true});});
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.listen(PORT,()=>console.log(`S&S Cake House running at http://localhost:${PORT}`));
