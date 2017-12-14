cmake_minimum_required(VERSION 2.8.3)
project(label_filter)

find_package(PCL 1.1 REQUIRED)
include_directories(${PCL_INCLUDE_DIRS})
link_directories(${PCL_LIBRARY_DIRS})
add_definitions(${PCL_DEFINITIONS})

set(OpenCV_STATIC ON)
set(OpenCV_CUDA OFF)
set(OpenCV_DIR "${CMAKE_SOURCE_DIR}/../install")

find_package(OpenCV REQUIRED)

include_directories(${OpenCV_INCLUDE_DIRS})
link_directories(${OpenCV_LIB_DIR})

include_directories(/usr/local/include)

add_executable(label_filter label_filter.cpp)
target_link_libraries(label_filter ${PCL_LIBRARIES} ${OpenCV_LIBS})
