package com.endava.cashflash.config;

import com.endava.cashflash.constants.ApiPaths;
import com.endava.cashflash.security.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers the WebSocket endpoint for STOMP clients
        registry.addEndpoint(ApiPaths.WEBSOCKET_ENDPOINT)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Configures application, user, and broker destination prefixes
        registry.setApplicationDestinationPrefixes(ApiPaths.WEBSOCKET_APP_PREFIX);
        registry.setUserDestinationPrefix(ApiPaths.WEBSOCKET_USER_PREFIX);
        registry.enableSimpleBroker(ApiPaths.WEBSOCKET_TOPIC_PREFIX, ApiPaths.WEBSOCKET_QUEUE_PREFIX);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Applies auth interception on inbound STOMP messages
        registration.interceptors(stompAuthChannelInterceptor);
    }
}