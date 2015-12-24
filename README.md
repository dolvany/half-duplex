# half-duplex

Node.js program that crawls a Cisco network using CDP and finds all of the half-duplex ethernet interfaces. The goal is the discovery of speed/duplex mismatches. Sends the result via email.

# install

- install [node.js](https://nodejs.org/)
- install half-duplex
```
npm install half-duplex
```

# configure

- Rename config file.
```
ren config.js.example config.js
```

- Configure parameters in config.js as follows.

seedDevices: One device per CDP island.  
community: SNMPv2c community string.  
smtpServer: SMTP relay accessible to the host.  
emailFrom: Email from address.  
emailTo: Email to address.  
ignoreDevices: Exclude devices from polling.

# usage

```
cd c:\pathto\half-duplex  
npm start
```

# windows task scheduling

program: npm  
arguments: start  
start in: c:\pathto\half-duplex
