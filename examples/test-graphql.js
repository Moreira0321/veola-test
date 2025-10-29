/**
 * Example script for testing GraphQL endpoints programmatically
 * 
 * Usage:
 *   node examples/test-graphql.js
 */

const http = require('http');

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';
const REST_BASE_URL = 'http://localhost:4000';

// Wait for /graphql to be ready
async function waitForGraphQLEndpoint(timeoutMs = 8000, intervalMs = 250) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const options = {
                hostname: 'localhost',
                port: 4000,
                path: '/graphql',
                method: 'GET'
            };
            const req = http.request(options, (res) => {
                // Consider anything not 404 as signal that middleware exists
                if (res.statusCode !== 404) {
                    resolve(true);
                } else if (Date.now() - start >= timeoutMs) {
                    reject(new Error('Timed out waiting for /graphql to be ready'));
                } else {
                    setTimeout(attempt, intervalMs);
                }
            });
            req.on('error', () => {
                if (Date.now() - start >= timeoutMs) {
                    reject(new Error('Timed out waiting for /graphql to be ready'));
                } else {
                    setTimeout(attempt, intervalMs);
                }
            });
            req.end();
        };
        attempt();
    });
}

// Helper function to make REST API requests
function restRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : null;

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Request failed: ${e.message}`));
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Helper function to make GraphQL requests
function graphqlRequest(query, variables = null, token = null) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            query,
            ...(variables && { variables })
        });

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        const error = data ? JSON.parse(data) : { message: `HTTP ${res.statusCode}` };
                        reject(new Error(`GraphQL request failed: ${JSON.stringify(error)}`));
                        return;
                    }
                    const result = JSON.parse(data);
                    // Check for GraphQL errors
                    if (result.errors) {
                        reject(new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`));
                        return;
                    }
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}, Response: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Request failed: ${e.message}`));
        });

        req.write(postData);
        req.end();
    });
}

// Register a new user via REST API
async function testRestRegister() {
    console.log('\n📝 Testing REST Register...');
    const body = {
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
    };

    try {
        const result = await restRequest('POST', '/auth/register', body);
        if (result.status === 201) {
            console.log('✅ Register Success:', JSON.stringify(result.data, null, 2));
            return body.email; // Return email for login
        } else {
            console.error('❌ Register Failed:', JSON.stringify(result.data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('❌ Register Failed:', error.message);
        return null;
    }
}

// Login via REST API
async function testRestLogin(email, password) {
    console.log('\n🔐 Testing REST Login...');
    const body = { email, password };

    try {
        const result = await restRequest('POST', '/auth/login', body);
        if (result.status === 200 && result.data.token) {
            console.log('✅ Login Success:', JSON.stringify({ token: result.data.token, email }, null, 2));
            return result.data.token;
        } else {
            console.error('❌ Login Failed:', JSON.stringify(result.data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('❌ Login Failed:', error.message);
        return null;
    }
}

// Example: Get current user (requires auth)
async function testMe(token) {
    console.log('\n👤 Testing Me Query...');
    const query = `
        query {
            me {
                id
                email
                name
                role
                createdAt
            }
        }
    `;

    try {
        const result = await graphqlRequest(query, null, token);
        console.log('✅ Me Query Success:', JSON.stringify(result, null, 2));
        return result.data?.me;
    } catch (error) {
        console.error('❌ Me Query Failed:', error.message);
        return null;
    }
}

// Example: Create appointment (requires auth)
async function testCreateAppointment(token) {
    console.log('\n📅 Testing Create Appointment Mutation...');
    const query = `
        mutation CreateAppointment($input: AppointmentInput!) {
            createAppointment(input: $input) {
                id
                title
                description
                startTime
                endTime
                status
                userId
                createdAt
            }
        }
    `;
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const variables = {
        input: {
            title: 'Test Appointment',
            description: 'This is a test appointment',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: 'pending'
        }
    };

    try {
        const result = await graphqlRequest(query, variables, token);
        console.log('✅ Create Appointment Success:', JSON.stringify(result, null, 2));
        return result.data?.createAppointment?.id;
    } catch (error) {
        console.error('❌ Create Appointment Failed:', error.message);
        return null;
    }
}

// Example: Get appointments (requires auth)
async function testGetAppointments(token) {
    console.log('\n📋 Testing Get Appointments Query...');
    const query = `
        query {
            appointments {
                id
                title
                description
                startTime
                endTime
                status
                userId
            }
        }
    `;

    try {
        const result = await graphqlRequest(query, null, token);
        console.log('✅ Get Appointments Success:', JSON.stringify(result, null, 2));
        return result.data?.appointments;
    } catch (error) {
        console.error('❌ Get Appointments Failed:', error.message);
        return null;
    }
}

// Example: Get single appointment (requires auth)
async function testGetAppointment(token, appointmentId) {
    console.log('\n🔍 Testing Get Appointment Query...');
    const query = `
        query GetAppointment($id: ID!) {
            appointment(id: $id) {
                id
                title
                description
                startTime
                endTime
                status
            }
        }
    `;
    const variables = { id: appointmentId };

    try {
        const result = await graphqlRequest(query, variables, token);
        console.log('✅ Get Appointment Success:', JSON.stringify(result, null, 2));
        return result.data?.appointment;
    } catch (error) {
        console.error('❌ Get Appointment Failed:', error.message);
        return null;
    }
}

// Example: Update appointment (requires auth)
async function testUpdateAppointment(token, appointmentId) {
    console.log('\n✏️ Testing Update Appointment Mutation...');
    const query = `
        mutation UpdateAppointment($id: ID!, $input: AppointmentUpdateInput!) {
            updateAppointment(id: $id, input: $input) {
                id
                title
                description
                status
                updatedAt
            }
        }
    `;
    const variables = {
        id: appointmentId,
        input: {
            title: 'Updated Appointment Title',
            status: 'confirmed'
        }
    };

    try {
        const result = await graphqlRequest(query, variables, token);
        console.log('✅ Update Appointment Success:', JSON.stringify(result, null, 2));
        return result.data?.updateAppointment;
    } catch (error) {
        console.error('❌ Update Appointment Failed:', error.message);
        return null;
    }
}

// Example: Delete appointment (requires auth)
async function testDeleteAppointment(token, appointmentId) {
    console.log('\n🗑️ Testing Delete Appointment Mutation...');
    const query = `
        mutation DeleteAppointment($id: ID!) {
            deleteAppointment(id: $id)
        }
    `;
    const variables = { id: appointmentId };

    try {
        const result = await graphqlRequest(query, variables, token);
        console.log('✅ Delete Appointment Success:', JSON.stringify(result, null, 2));
        return result.data?.deleteAppointment;
    } catch (error) {
        console.error('❌ Delete Appointment Failed:', error.message);
        return null;
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting GraphQL API Tests...');
    console.log(`📍 GraphQL Endpoint: ${GRAPHQL_ENDPOINT}`);
    console.log(`📍 REST API Base: ${REST_BASE_URL}\n`);

    // Ensure /graphql is mounted (in case server was just started)
    try {
        await waitForGraphQLEndpoint();
        console.log('✅ /graphql is reachable');
    } catch (e) {
        console.log('⚠️ /graphql not ready yet, continuing (will fail fast if unreachable).');
    }

    // Step 1: Register via REST API
    const testEmail = await testRestRegister();
    
    if (!testEmail) {
        console.log('\n⚠️ Registration failed. Trying with existing user...');
        // Try login with a test account (if it exists)
        const token = await testRestLogin('test@example.com', 'password123');
        if (!token) {
            console.log('\n❌ No authentication token available. Cannot proceed with tests.');
            return;
        }
        await runGraphQLTests(token);
        return;
    }

    // Step 2: Login via REST API to get token
    const token = await testRestLogin(testEmail, 'password123');
    
    if (!token) {
        console.log('\n⚠️ No authentication token available. Some tests will be skipped.');
        return;
    }

    // Step 3: Run GraphQL tests with the token
    await runGraphQLTests(token);
}

// Run GraphQL-specific tests
async function runGraphQLTests(token) {

    // Test authenticated queries
    await testMe(token);
    
    // Test appointment operations
    const appointmentId = await testCreateAppointment(token);
    
    if (appointmentId) {
        await testGetAppointments(token);
        await testGetAppointment(token, appointmentId);
        await testUpdateAppointment(token, appointmentId);
        // Uncomment to test delete:
        // await testDeleteAppointment(token, appointmentId);
    }

    console.log('\n✨ Tests completed!');
}

// Run if executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    restRequest,
    graphqlRequest,
    testRestRegister,
    testRestLogin,
    testMe,
    testCreateAppointment,
    testGetAppointments,
    testGetAppointment,
    testUpdateAppointment,
    testDeleteAppointment
};

