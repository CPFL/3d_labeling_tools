cmake_minimum_required(VERSION 2.8.3)
project(label_filter)

find_package(PCL 1.1 REQUIRED)
include_directories(${PCL_INCLUDE_DIRS})
link_directories(${PCL_LIBRARY_DIRS})
add_definitions(${PCL_DEFINITIONS})

include_directories(/usr/local/include)

add_executable(label_filter label_filter.cpp)
target_link_libraries(label_filter ${PCL_LIBRARIES})
