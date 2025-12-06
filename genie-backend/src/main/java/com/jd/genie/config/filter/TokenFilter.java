package com.jd.genie.config.filter;

import com.jd.genie.config.GenieConfig;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;

import java.io.IOException;

/**
 * Token鉴权过滤器
 * 验证请求头中的token是否有效
 */
@Slf4j
public class TokenFilter implements Filter {

    private GenieConfig genieConfig;

    public void setGenieConfig(GenieConfig genieConfig) {
        this.genieConfig = genieConfig;
    }

    private static final String TOKEN_HEADER = "X-Auth-Token";
    private static final String TOKEN_PARAM = "token";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 排除健康检查接口
        String requestPath = httpRequest.getRequestURI();
        if (requestPath != null && requestPath.contains("/web/health")) {
            chain.doFilter(request, response);
            return;
        }

        // 排除后端内部调用
        // /AutoAgent 是后端服务间调用的接口，不需要token验证
        // 如果请求来自127.0.0.1且路径是/AutoAgent，则跳过验证
        String clientIp = httpRequest.getRemoteAddr();
        boolean isInternalCall = ("127.0.0.1".equals(clientIp) || "localhost".equals(clientIp) || "0:0:0:0:0:0:0:1".equals(clientIp))
                && requestPath != null && requestPath.equals("/AutoAgent");
        
        if (isInternalCall) {
            log.debug("跳过内部调用token验证，请求路径: {}, 客户端IP: {}", requestPath, clientIp);
            chain.doFilter(request, response);
            return;
        }

        // 获取配置的token
        String configuredToken = genieConfig.getAuthToken();
        
        // 如果未配置token，则跳过鉴权
        if (StringUtils.isEmpty(configuredToken)) {
            chain.doFilter(request, response);
            return;
        }

        // 记录所有请求头（用于调试）
        log.info("请求路径: {}, 请求方法: {}, 客户端IP: {}", 
                httpRequest.getRequestURI(), httpRequest.getMethod(), clientIp);
        log.info("请求头 X-Auth-Token: {}", httpRequest.getHeader(TOKEN_HEADER));
        log.info("请求参数 token: {}", httpRequest.getParameter(TOKEN_PARAM));

        // 获取请求中的token（优先从header获取，其次从参数获取）
        String requestToken = httpRequest.getHeader(TOKEN_HEADER);
        if (StringUtils.isEmpty(requestToken)) {
            requestToken = httpRequest.getParameter(TOKEN_PARAM);
        }
        
        log.info("提取到的token: {}", StringUtils.isEmpty(requestToken) ? "空" : 
                requestToken.substring(0, Math.min(10, requestToken.length())) + "...");

        // 验证token
        if (StringUtils.isEmpty(requestToken)) {
            log.warn("Token缺失，请求路径: {}, 客户端IP: {}", 
                    httpRequest.getRequestURI(), clientIp);
            httpResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            httpResponse.setContentType("application/json;charset=UTF-8");
            httpResponse.getWriter().write("{\"code\":401,\"msg\":\"Token验证失败：请求中未提供token，请在请求头中携带X-Auth-Token或在参数中提供token\"}");
            return;
        }
        
        if (!configuredToken.equals(requestToken)) {
            log.warn("Token错误，请求路径: {}, 客户端IP: {}", 
                    httpRequest.getRequestURI(), clientIp);
            httpResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            httpResponse.setContentType("application/json;charset=UTF-8");
            httpResponse.getWriter().write("{\"code\":401,\"msg\":\"Token验证失败：提供的token不正确，请检查token是否正确\"}");
            return;
        }

        // token验证通过，继续处理请求
        chain.doFilter(request, response);
    }
}

