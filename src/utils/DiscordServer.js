module.exports = class ServerInfo{

    constructor(server, user) {
      this.server = server; 
      this.user = user;
    }

    getServer(){
        return this.server
    }

    getServerId(){
        return this.server.id
    }

    getUser(){
        return this.user
    }

    getUserId(){
        return this.user.id
    }

    
  }
  