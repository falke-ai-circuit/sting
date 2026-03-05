-- STING Proxy Lua Module
-- Handles verdict checking via Redis and session tracking

local redis = require "resty.redis"
local md5 = ngx.md5

local _M = {}

-- Redis connection config
local REDIS_HOST = os.getenv("REDIS_HOST") or "10.10.10.104"
local REDIS_PORT = tonumber(os.getenv("REDIS_PORT")) or 6379
local REDIS_TIMEOUT = 1000

-- Get or create session ID
function _M.get_session_id()
    local client_ip = ngx.var.remote_addr or "unknown"
    local user_agent = ngx.var.http_user_agent or ""
    return md5(client_ip .. user_agent)
end

-- Connect to Redis
function _M.redis_connect()
    local red = redis:new()
    red:set_timeout(REDIS_TIMEOUT)
    
    local ok, err = red:connect(REDIS_HOST, REDIS_PORT)
    if not ok then
        ngx.log(ngx.ERR, "Redis connect failed: ", err)
        return nil, err
    end
    
    return red
end

-- Get session verdict from Redis
function _M.get_verdict(session_id)
    local red, err = _M.redis_connect()
    if not red then
        return "LAB"  -- Default to LAB on Redis failure
    end
    
    local res, err = red:get("sting:session:" .. session_id)
    
    -- Put connection back to pool
    red:set_keepalive(10000, 100)
    
    if res and res ~= ngx.null then
        return res
    end
    
    -- New session, set default
    _M.set_verdict(session_id, "LAB")
    return "LAB"
end

-- Set session verdict in Redis
function _M.set_verdict(session_id, verdict, ttl)
    ttl = ttl or 3600  -- Default 1 hour
    
    local red, err = _M.redis_connect()
    if not red then
        return false, err
    end
    
    local ok, err = red:setex("sting:session:" .. session_id, ttl, verdict)
    red:set_keepalive(10000, 100)
    
    if not ok then
        ngx.log(ngx.ERR, "Redis set failed: ", err)
        return false, err
    end
    
    return true
end

-- Log request to Redis
function _M.log_request(session_id, method, path, body_size, headers)
    local red, err = _M.redis_connect()
    if not red then
        return
    end
    
    local timestamp = ngx.time()
    local log_entry = string.format('%d|%s|%s|%d|%s',
        timestamp,
        method or "GET",
        path or "/",
        body_size or 0,
        headers or ""
    )
    
    -- Add to request list
    red:lpush("sting:session:" .. session_id .. ":requests", log_entry)
    red:ltrim("sting:session:" .. session_id .. ":requests", 0, 99)
    
    -- Increment counters
    red:hincrby("sting:session:" .. session_id .. ":stats", "requests", 1)
    red:hincrby("sting:session:" .. session_id .. ":stats", "bytes", body_size or 0)
    
    -- Set session metadata
    red:hset("sting:session:" .. session_id .. ":meta",
        "last_seen", timestamp,
        "src_ip", ngx.var.remote_addr or "unknown"
    )
    
    red:set_keepalive(10000, 100)
end

-- Get session stats from Redis
function _M.get_session_stats(session_id)
    local red, err = _M.redis_connect()
    if not red then
        return nil, err
    end
    
    local stats, err = red:hgetall("sting:session:" .. session_id .. ":stats")
    local meta, err = red:hgetall("sting:session:" .. session_id .. ":meta")
    
    red:set_keepalive(10000, 100)
    
    return {
        stats = stats,
        meta = meta
    }
end

-- Handle NUKE verdict
function _M.handle_nuke(session_id)
    ngx.log(ngx.WARN, "STING NUKE applied to session: ", session_id)
    
    -- Log the nuke action
    _M.log_request(session_id, "NUKE", "CONNECTION_DROPPED", 0, "")
    
    -- Return 444 to drop connection without response
    return ngx.exit(444)
end

return _M
