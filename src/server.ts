import express, { Application, Request, Response } from "express";
 
export class Server {
 private app: Application;
 
 private readonly DEFAULT_PORT = 3000;
 
 constructor() {
   this.initialize();
 
   this.handleRoutes();
 }
 
 private initialize(): void {
   this.app = express();
 }
 
 private handleRoutes(): void {
   this.app.get("/", (req, res) => {
     res.send(`<h1>Hello World</h1>`); 
   });
 }
 
 public listen(callback: (port: number) => void): void {
   this.app.listen(this.DEFAULT_PORT, () =>
     callback(this.DEFAULT_PORT)
   );
 }
}