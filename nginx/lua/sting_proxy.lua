-- STING Proxy Lua Module
local redis = require "resty.redis"

local _M = {}

function _M.get_session_id()
    local client_ip = ngx.var.remote_addr or "unknown"
    local user_agent = ngx.var.http_user_agent or ""
    return ngx.md5(client_ip .. user_agent)
end

function _M.redis_connect()
    local red = redis:new()
    red:set_timeout(1000)
    
    local ok, err = red:connect("10.10.10.104", 6379)
    if not ok then
        ngx.log(ngx.ERR, "Redis connect failed: ", err)
        return nil
    end
    
    return red
end

function _M.get_verdict(session_id)
    local red = _M.redis_connect()
    if not red then
        return "LAB"
    end
    
    local res, err = red:get("sting:session:" .. session_id)
    red:set_keepalive(10000, 100)
    
    if res and res ~= ngx.null then
        return res
    end
    
    _M.set_verdict(session_id, "LAB")
    return "LAB"
end

function _M.set_verdict(session_id, verdict, ttl)
    ttl = ttl or 3600
    
    local red = _M.redis_connect()
    if not red then
        return false
    end
    
    red:setex("sting:session:" .. session_id, ttl, verdict)
    red:set_keepalive(10000, 100)
    return true
end

return _M
