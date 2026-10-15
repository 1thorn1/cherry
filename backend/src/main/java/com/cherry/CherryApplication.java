package com.cherry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class CherryApplication {

	public static void main(String[] args) {
		// 날짜 경계·LocalDateTime.now()는 전부 한국 시간 기준(B-4). DB는 이미 Asia/Seoul이라
		// 서버가 다른 시간대에 떠도 앱과 DB가 같은 "지금"을 보게 맞춘다.
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(CherryApplication.class, args);
	}

}
