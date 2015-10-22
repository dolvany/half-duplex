var seedDevices=['192.168.0.1','10.0.0.1']
var community = 'public';
var smtpServer = '127.0.0.1'
var emailFrom = 'team@org';
var emailTo = 'team@org';

var snmp = require('snmp-native');
var ip = require('ip');
var ipRegex = require('ip-regex');
var session = new snmp.Session({ community: community });
var polledHosts = [];
var uniqueHosts = [];
var cbCount = 0;
var halfDuplexTotal = 0;
var duplexReportBody = '';
var duplexReportHeader = '';
var SMTPConnection = require('smtp-connection');
var connection = new SMTPConnection({host: smtpServer});

function filterHost (host) {
    if(polledHosts.indexOf(host) == -1 && ipRegex({exact: true}).test(host)){
        getNeighbors(host);
    }
}
function getNeighbors (host) {
    ++cbCount;
    session.getSubtree({ host: host, oid: [1,3,6,1,4,1,9,9,23,1,2,1,1,4] }, function (error, varbinds) {
        --cbCount;
        polledHosts.push(host);
        if (error) {
            console.log('Fail :(');
        } else {
            getName(host);
            varbinds.forEach(function (vb) {
                filterHost(ip.toString(vb.valueRaw));
            });
        }
        emailReport();
    });
}
function getName (host) {
    ++cbCount;
    session.get({ host: host, oid: [1,3,6,1,2,1,1,5,0] }, function (error, varbinds) {
        --cbCount;
        if (error) {
            console.log('Fail :(');
        } else {
            filterName(varbinds[0].value,host);
        }
        emailReport();
    });
}
function filterName (name,host) {
    if (uniqueHosts.indexOf(name) == -1) {
        uniqueHosts.push(name);
        getDuplex(name.split('.')[0],host);
    }
}
function getDuplex (name,host) {
    ++cbCount;
    session.getSubtree({ host: host, oid: [1,3,6,1,2,1,10,7,2,1,19] }, function (error, varbinds) {
        --cbCount;
        if (error) {
            console.log('Fail :(');
        } else {
            varbinds.forEach(function (vb) {
                filterDuplex(name,host,vb.oid.pop(),vb.value)
            });
        }
        emailReport();
    });
}
function filterDuplex (name,host,ifIndex,duplex) {
    if (duplex == 2) {
        getIntStatus(name,host,ifIndex)
    }
}
function getIntStatus (name,host,ifIndex) {
    ++cbCount;
    session.get({ host: host, oid: [1,3,6,1,2,1,2,2,1,8,ifIndex] }, function (error, varbinds) {
        --cbCount;
        if (error) {
            console.log('Fail :(');
        } else {
            filterIntStatus(name,host,ifIndex,varbinds[0].value);
        }
        emailReport();
    });
}
function filterIntStatus (name,host,ifIndex,intStatus) {
    if (intStatus==1) {
        getIntDetails(name,host,ifIndex);
    }
}
function getIntDetails (name,host,ifIndex) {
    ++cbCount;
    session.getAll({ host: host, oids: [[1,3,6,1,2,1,31,1,1,1,1,ifIndex],[1,3,6,1,2,1,31,1,1,1,18,ifIndex]] }, function (error, varbinds) {
        --cbCount;
        if (error) {
            console.log('Fail :(');
        } else {
            duplexReportBody += name+' '+varbinds[0].value+' '+varbinds[1].value+'\r\n';
            ++halfDuplexTotal;
        }
        emailReport();
    });
}
function emailReport () {
    if (cbCount===0) {
        duplexReportHeader = 'From: '+emailFrom+'\r\nTo: '+emailTo+'\r\nSubject: '+halfDuplexTotal+' Half Duplex Interfaces\r\n\r\n';
        connection.connect(function () {
            connection.send({from: emailFrom, to:emailTo}, duplexReportHeader+duplexReportBody, function () {
                connection.quit();
                session.close();
                process.exit();
            });
        });
    }
}
seedDevices.forEach(function (device) {
    filterHost(device);
});
