#!/bin/bash

# 开始启动前端服务
cd ui && sh start.sh && cd ..

# 开始启动后端服务 首次启动需要执行build.sh进行编译
cd genie-backend && sh build.sh && sh start.sh && cd ..

# 开始启动工具服务 首次启动需要执行python -m genie_tool.db.db_engine初始化数据库
cd genie-tool && python -m genie_tool.db.db_engine  && sh start.sh && cd ..

# 开始启动MCP服务
cd genie-client && sh start.sh && cd ..
