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

 Date: 27/10/2020 11:00:38
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user_data
-- ----------------------------
DROP TABLE IF EXISTS `user_data`;
CREATE TABLE `user_data`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `datas` varchar(3000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `map_id` int(11) NOT NULL DEFAULT 1001,
  `pos_x` int(11) NOT NULL DEFAULT 2,
  `pos_y` int(11) NOT NULL DEFAULT 3,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 257 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

SET FOREIGN_KEY_CHECKS = 1;
