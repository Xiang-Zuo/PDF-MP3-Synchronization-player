import sys
sys.path.append('/usr/local/lib/python2.7/site-packages')
import cv2
import os
import numpy as np
import imutils
import math
import shutil
import time

def removeDuplicat(arrPoint):
    for thisPoint in arrPoint:
        duplicate = []
        for otherPoint in arrPoint:
            if not ((thisPoint[0] == otherPoint[0]) and (thisPoint[1] == otherPoint[1])):
                if thisPoint[0] == otherPoint [0]:
                    if abs(thisPoint[1] - otherPoint[1]) < 5:
                        duplicate.append(otherPoint)
                elif thisPoint[1] == otherPoint [1]:
                    if abs(thisPoint[0] - otherPoint[0]) < 5:
                        duplicate.append(otherPoint)
                elif (abs(thisPoint[0] - otherPoint[0]) < 5) and (abs(thisPoint[1] - otherPoint[1]) < 5):
                    duplicate.append(otherPoint)

        for ele in duplicate:
            arrPoint.remove(ele)

    return arrPoint

def combineLines(list1, list2, list3):
    lists = []
    sortedLists = []
    for ele in list1:
        list = []
        list.append(ele)
        lists.append(list)

    for ele in list2:
        for line in lists:
            if abs(ele[1] - line[0][1]) < 40:
                line.append(ele)

    for ele in list3:
        for line in lists:
            if abs(ele[1] - line[0][1]) < 40:
                line.append(ele)

    for line in lists:
        line = sortLineOfSymbols(line)
        sortedLists.append(line)

    return sortedLists

def sortLineOfSymbols(line):
    return (sorted(line, key=lambda x: int(x[0]), reverse=False))

def templateDetect(template, image_o):
    template = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
    image = cv2.cvtColor(image_o, cv2.COLOR_BGR2GRAY)
    symbols = []
    loc = False
    # need to put in function attribute
    threshold = 0.82
    w, h = template.shape[::-1]

    for scale in np.linspace(0.2, 1.0, 20)[::-1]:
        resized = imutils.resize(template, width = int(template.shape[1] * scale))
        w, h = resized.shape[::-1]
        res = cv2.matchTemplate(image,resized,cv2.TM_CCOEFF_NORMED)
        loc = np.where( res >= threshold)
        if len(zip(*loc[::-1])) > 0:
            break
            
    if loc and len(zip(*loc[::-1])) > 0:
        for pt in zip(*loc[::-1]):
            symbols.append(pt)
            cv2.rectangle(image_o, pt, (pt[0] + w, pt[1] + h), (0,0,255), 0)
            
    return symbols, resized

def removeOverLappedSymbol(clefs, barLines, boldBarLines):
    for c in clefs:
        for b in barLines:
            if abs(c[0] - b[0]) < 25 and abs(c[1] - b[1]) < 25:
                #print str(c) + " is overlapped with " + str(b)
                del barLines[barLines.index(b)]
                
    for bo in boldBarLines:
        for b in barLines:
            if abs(bo[0] - b[0]) < 25 and abs(bo[1] - b[1]) < 25:
                del barLines[barLines.index(b)]

    return clefs,barLines,boldBarLines

def cropMeasures(lines_of_symbols, clefTemplate, barLineTemplate, boldBarLineTemplate, image, imageForDetection):
    #remove previous image folder with same image name
    imageForDetection = imageForDetection.replace('.png', '')
    dirName = 'image/' + imageForDetection
    if os.path.exists(dirName):
        shutil.rmtree(dirName)

    cw, ch = clefTemplate.shape[::-1]
    bw, bh = barLineTemplate.shape[::-1]
    bow, boh = boldBarLineTemplate.shape[::-1]
    widthCorrection = int(bw/2)

    for line in lines_of_symbols:
        lineNumber = lines_of_symbols.index(line)
        heights = []
        widths = []
        images = []
        imageNames = []
        heightTuple = ()

        if len(line) < 2:
            f = open("log.txt", "a")
            f.write("Error when cropping the measure, might be incorrect detect music symbol!")
            f.close()
        elif len(line) == 2:
            for symbol in line:
                index = line.index(symbol)
                if index == 0:
                    heightTuple = (symbol[1] - 80, symbol[1] + ch + 80)
                    heights.append(heightTuple)
                    widthTuple = (symbol[0] - 30, line[index + 1][0] + widthCorrection)
                    widths.append(widthTuple)
        else:
            for symbol in line:
                index = line.index(symbol)

                # assume each line has more than 2 measure
                if index == 0:
                    heightTuple = (symbol[1] - 80, symbol[1] + ch + 80)
                    heights.append(heightTuple)
                    widthTuple = (symbol[0] - 30, line[index + 1][0] + widthCorrection)
                    widths.append(widthTuple)
                elif index > 0 and index < len(line) - 2:
                    heights.append(heightTuple)
                    widthTuple = (symbol[0] + widthCorrection, line[index + 1][0] + widthCorrection)
                    widths.append(widthTuple)
                elif index == len(line) - 2:
                    heights.append(heightTuple)
                    widthTuple = (symbol[0] + widthCorrection, line[index + 1][0] + widthCorrection + 30)
                    widths.append(widthTuple)

        for index in range(len(heights)):
            img = image[heights[index][0]:heights[index][1], widths[index][0]:widths[index][1]]
            if index <= 9:
                imageName = str(lineNumber) + '_' + str(index)
            elif index > 9 and index < 19:
                temp = 9 * 10 + (index - 9)
                imageName = str(lineNumber) + '_' + str(temp)
            else:
                print "too many meausre in a line"

            images.append(img)
            imageNames.append(imageName)

        createImageFiles(imageNames,images,imageForDetection)

def createImageFiles(imageNames, images, imageForDetection):
    dirName = 'image/' + imageForDetection
    if not os.path.exists(dirName):
        os.makedirs(dirName)
        print("Directory " , dirName ,  " Created ")
    else:
        print("Directory " , dirName ,  " already exists")
    f = open("log.txt", "a")
    for imageName in imageNames:
        filePath = os.getcwd() + '/' + dirName + '/' + imageName + '.png'
        print (filePath)
        f.write(filePath + "\n")
        cv2.imwrite(filePath, images[imageNames.index(imageName)])
    f.close()

def main():
    #print sys.argv[1]
    #template_clef_G = cv2.imread('clef_G.png')  # template image
    template_barLine = cv2.imread('barLine.png')
    template_boldBarLine = cv2.imread('boldBarLine.png')
    #imageForDetection = '0004.png'

    if os.path.isfile(sys.argv[1]) and sys.argv[2]:
        imageForDetection = sys.argv[1]
        template_clef = cv2.imread(sys.argv[2])
        print "e"
        if os.path.exists("log.txt"):
            open("log.txt", "w").close()
    else:
        print "File " + sys.argv[1] + " does not exist! exit()"
        return

    image_o = cv2.imread(imageForDetection)  # image
    image = cv2.cvtColor(image_o, cv2.COLOR_BGR2GRAY)

    clefs = []
    barLines = []
    boldBarLines = []
    combinedLines = []

    clefs, newClefTemplate = templateDetect(template_clef,image_o)
    barLines, newBarLineTemplate = templateDetect(template_barLine,image_o)
    boldBarLines, newBoldBarLineTemplate = templateDetect(template_boldBarLine, image_o)
    clefs = removeDuplicat(clefs)
    barLines = removeDuplicat(barLines)
    boldBarLines = removeDuplicat(boldBarLines)
    clefs,barLines,boldBarLines = removeOverLappedSymbol(clefs,barLines,boldBarLines)
    combinedLines = combineLines(clefs, barLines, boldBarLines)
    print (combinedLines)
    cropMeasures(combinedLines, newClefTemplate, newBarLineTemplate, newBoldBarLineTemplate, image, imageForDetection)
    time.sleep(3)
    
    f = open("log.txt", "a")
    f.write("complete successfully!")
    f.close()
    
if __name__ == "__main__":
    main()
