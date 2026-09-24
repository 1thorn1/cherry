package com.cherry.user;

import com.cherry.common.InvalidFileException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/png", "image/jpeg", "image/webp", "image/gif");

    private final UserRepository userRepository;

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Transactional
    public User updateNickname(Long userId, String nickname) {
        User user = userRepository.findById(userId).orElseThrow();
        user.updateNickname(nickname.trim());
        return user;
    }

    // v1은 로컬 디스크 + 경로만 DB에 저장 (S3/R2는 v2, B-9 파일 저장 원칙 참고).
    // 프로필 사진은 사용자당 1장이라 새로 올리면 기존 파일은 지운다.
    @Transactional
    public User updateProfileImage(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일을 선택해주세요");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidFileException("이미지 파일(PNG, JPEG, WEBP, GIF)만 올릴 수 있습니다");
        }

        User user = userRepository.findById(userId).orElseThrow();

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
        String filename = "profile-" + userId + "-" + UUID.randomUUID() + extension;

        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target);

            deleteExistingImage(user.getProfileImagePath());
            user.updateProfileImagePath(filename);
        } catch (IOException e) {
            throw new UncheckedIOException("이미지를 저장하지 못했습니다", e);
        }

        return user;
    }

    private void deleteExistingImage(String existingFilename) {
        if (existingFilename == null) return;
        try {
            Files.deleteIfExists(Path.of(uploadDir).resolve(existingFilename));
        } catch (IOException ignored) {
            // 옛 파일 삭제 실패는 무시 — 디스크 공간 낭비는 되지만 요청을 막을 정도는 아님
        }
    }
}
