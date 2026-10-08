package com.mmc.collection.common.email.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;


    @Value("${spring.mail.username}")
    private String fromEmail;
    /**
     * 发送验证码邮件
     * @param to 收件人邮箱
     * @param code 验证码
     * @param title 标题
     * @param content  内容
     */
    public void sendVerificationCode(String to, String code ,String title , String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(title);
        message.setText(content+"\n"+"您的验证码是：" + code + "，有效期5分钟。");

        try {
            mailSender.send(message);
            System.out.println("邮件已发送至：" + to); // 可以改用日志
        } catch (Exception e) {
            System.out.println("邮件发送失败：" + e.getMessage());
            throw new RuntimeException("邮件发送失败", e);
        }
    }
}
