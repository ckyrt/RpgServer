/*
 Navicat Premium Data Transfer

 Source Server         : 139.155.80.3
 Source Server Type    : MySQL
 Source Server Version : 50645
 Source Host           : 139.155.80.3:3306
 Source Schema         : rpg

 Target Server Type    : MySQL
 Target Server Version : 50645
 File Encoding         : 65001

 Date: 08/09/2020 20:37:18
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for chat_data
-- ----------------------------
DROP TABLE IF EXISTS `chat_data`;
CREATE TABLE `chat_data`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `text` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `send_time` bigint(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Compact;

SET FOREIGN_KEY_CHECKS = 1;
