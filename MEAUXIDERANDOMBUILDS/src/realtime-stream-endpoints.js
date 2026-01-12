/**
 * Realtime & Streaming API Endpoints
 * Cloudflare Stream, TURN Server, and SFU integration
 */

/**
 * Get Cloudflare Stream live input status
 * Helps dashboard stay ready for live streams
 */
async function handleStreamStatus(request, env, tenantId, corsHeaders) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_STREAM_LIVE_INPUT_ID) {
    return jsonResponse({
      success: false,
      error: 'Cloudflare Stream not configured'
    }, 500, corsHeaders);
  }

  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const inputId = env.CLOUDFLARE_STREAM_LIVE_INPUT_ID;

    // Get live input status from Cloudflare Stream API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${inputId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stream API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const input = data.result;

    return jsonResponse({
      success: true,
      data: {
        id: input.id,
        name: input.meta?.name || 'meauxcloudconnected',
        status: input.status || 'disconnected',
        connected: input.status === 'connected',
        created: input.created,
        // Streaming URLs
        rtmps_url: 'rtmps://live.cloudflare.com:443/live/',
        rtmps_key: env.CLOUDFLARE_STREAM_RTMPS_KEY,
        hls_url: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/${inputId}/manifest/video.m3u8?protocol=llhlsbeta`,
        webrtc_whip: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/4fdde099f7d97ad2a8ea506cefc4934a${inputId}/webRTC/publish`,
        webrtc_whep: `https://${env.CLOUDFLARE_STREAM_SUBDOMAIN}/${inputId}/webRTC/play`,
      },
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Stream status error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Generate TURN server credentials for WebRTC
 * Used for 1-on-1 peer-to-peer connections
 */
async function handleTURNCredentials(request, env, tenantId, corsHeaders) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.REALTIME_TURN_TOKEN_ID || !env.REALTIME_TURN_API_TOKEN) {
    return jsonResponse({
      success: false,
      error: 'TURN server not configured'
    }, 500, corsHeaders);
  }

  try {
    const body = await request.json();
    const ttl = body.ttl || 86400; // 24 hours default

    // Generate TURN credentials via Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rtc/turn/credentials`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.REALTIME_TURN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: env.REALTIME_TURN_TOKEN_ID,
          ttl: ttl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TURN API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const credentials = data.result;

    // Format for RTCPeerConnection
    const iceServers = {
      iceServers: [
        {
          urls: [
            'stun:stun.cloudflare.com:3478',
            'turn:turn.cloudflare.com:3478?transport=udp',
            'turn:turn.cloudflare.com:3478?transport=tcp',
            'turns:turn.cloudflare.com:5349?transport=tcp',
          ],
          username: credentials.username,
          credential: credentials.password,
        },
      ],
    };

    return jsonResponse({
      success: true,
      data: iceServers,
      expires_at: credentials.expires_at,
    }, 200, corsHeaders);

  } catch (error) {
    console.error('TURN credentials error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}

/**
 * Create SFU session for multi-party calls
 * Used for 3+ participants (more efficient than P2P)
 */
async function handleSFUSession(request, env, tenantId, corsHeaders) {
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
  }

  if (!env.REALTIME_SFU_APP_ID || !env.REALTIME_SFU_API_TOKEN) {
    return jsonResponse({
      success: false,
      error: 'SFU not configured'
    }, 500, corsHeaders);
  }

  try {
    const body = await request.json();
    const { room_id, user_id, user_name } = body;

    // Create SFU session via Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/rtc/sessions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.REALTIME_SFU_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: env.REALTIME_SFU_APP_ID,
          room_id: room_id || `room-${Date.now()}`,
          user_id: user_id || `user-${Date.now()}`,
          user_name: user_name || 'Anonymous',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SFU API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const session = data.result;

    return jsonResponse({
      success: true,
      data: {
        session_id: session.session_id,
        room_id: session.room_id,
        token: session.token,
        ws_url: session.ws_url,
        app_id: env.REALTIME_SFU_APP_ID,
      },
    }, 200, corsHeaders);

  } catch (error) {
    console.error('SFU session error:', error);
    return jsonResponse({
      success: false,
      error: error.message,
    }, 500, corsHeaders);
  }
}
