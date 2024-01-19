// @ts-nocheck
import http from 'node:http'
import dnsPacket from 'dns-packet'
import fetch from 'node-fetch'

const server = http.createServer(async function (req, res) {
    let data = [];

    req.on('data', chunk => {
        data.push(chunk);
    });
    
    req.on('end', async () => {
        try {
            const msg = Buffer.concat(data);
            const query = dnsPacket.decode(msg);

            let response_encoded;
            if (query.questions && query.questions[0].name !== "") {

                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer zj5jyr4wqps4xfaiviy5`
                    },
                    body: JSON.stringify({ domain: query.questions[0].name, type: query.questions[0].type })
                };

                try {
                    const fetchResponse = await fetch(`https://ns-cache.fromafri.ca/dns-query`, requestOptions);
                    if (fetchResponse.ok) {
                        const fres = await fetchResponse.json();

                        if (fres.status === "404") {
                            throw({message: 'Unknown domain name', query: query})
                        }

                        if (fres.status === "500") {
                            throw({message: 'Error handling DNS query', query: query})
                        }

                        if (fres.status === "200") {

                            console.log(fres);
                            
                            // Respond authoritatively
                            let obj = {
                                type: 'response',
                                id: query.id,
                                questions: query.questions,
                                flags: dnsPacket.AUTHORITATIVE_ANSWER,
                                answers: [{
                                    type: fres.record.type,
                                    class: 'IN',
                                    name: fres.query,
                                    ttl: fres.record.ttl,
                                    data: fres.record.record // for A record, it's a string containing IP, for MX record, it's an array of objects
                                }],
                            };
                            response_encoded = dnsPacket.encode(obj);

                        } else {
                            throw({message: 'unknown DNS query error', query: query})
                        }
                    } else {
                        throw({message: 'fetch failed', query: query})
                    }
                } catch (err) {
                    // bubble up error to outer catch block
                    throw ({message: err.message || 'unknown error', query: err.query})
                }
            } else {
                throw({message: 'invalid query', query: query})
            }

            // Remember to write the response to the res object, not the server.
            res.writeHead(200, { 'Content-Type': 'application/dns-message' });
            res.end(response_encoded);
        } catch (error) {
            console.error(error.message || 'unknown error');
            res.writeHead(200, { 'Content-Type': 'application/dns-message' });// For other domains, return NXDOMAIN
            let obj = {
                type: 'response',
                id: error.query.id || '',
                questions: error.query.questions || '',
                flags: 3
            };
            let error_response_packet = dnsPacket.encode(obj);
            res.end(error_response_packet);
            return;
        }
    });
});

server.listen(8080);
