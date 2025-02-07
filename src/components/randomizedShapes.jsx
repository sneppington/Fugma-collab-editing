import React, { useRef, useEffect } from 'react';
import paper from 'paper';

const RandomShapes = () => {
    const canvasRef = useRef(null);
    const transitions = useRef([]);

    useEffect(() => {
        paper.setup(canvasRef.current);
        paper.project.currentStyle = new paper.Color('black');
        paper.view.draw();

        // Setup Random Shapes //
        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                const pointOutside = getRandomPointOutside();
                const targetPoint = getRandomPoint();
                const shape = Math.random() > 0.5 ? createCircle(pointOutside) : createSquare(pointOutside);
                shape.scale(getRandomScale());
                setTimeout(() => transitionShape(shape, targetPoint), i * (Math.random() * 200 + 100));
            }
        }, 300);

        const tool = new paper.Tool();
        let selectedItem = null;

        tool.onMouseDown = (event) => {
            const hitResult = paper.project.hitTest(event.point, { fill: true, stroke: true });

            if (hitResult && hitResult.item) {
                selectedItem = hitResult.item;
                selectedItem.data.offset = selectedItem.position.subtract(event.point);
            } else {
                const randomShape = Math.random() > 0.5 ? createCircle(event.point) : createSquare(event.point);
                randomShape.scale(getRandomScale());
                selectedItem = randomShape;
            }
        };

        tool.onMouseDrag = (event) => {
            if (selectedItem) {
                selectedItem.position = event.point.add(selectedItem.data.offset);
            }
        };

        tool.onMouseUp = () => {
            selectedItem = null;
        };
    }, []);

    const createCircle = (point) => {
        const color = getRandomColor();
        const circle = new paper.Path.Circle({
            center: point,
            radius: 30,
            fillColor: color,
        });
        circle.data.offset = new paper.Point(0, 0);
        return circle;
    };

    const createSquare = (point) => {
        const color = getRandomColor();
        const size = 60;
        const square = new paper.Path.Rectangle({
            point: point.subtract(new paper.Point(size / 2, size / 2)),
            size: [size, size],
            fillColor: color,
        });
        square.data.offset = new paper.Point(0, 0);
        return square;
    };

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const getRandomPoint = () => {
        const width = paper.view.size.width;
        const height = paper.view.size.height;
        const x = Math.random() * width;
        const y = Math.random() * height;
        return new paper.Point(x, y);
    };

    const getRandomPointOutside = () => {
        const width = paper.view.size.width;
        const height = paper.view.size.height;
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: // Left
                x = -50;
                y = Math.random() * height;
                break;
            case 1: // Right
                x = width + 50;
                y = Math.random() * height;
                break;
            case 2: // Top
                x = Math.random() * width;
                y = -50;
                break;
            case 3: // Bottom
                x = Math.random() * width;
                y = height + 50;
                break;
        }

        return new paper.Point(x, y);
    };

    const getRandomScale = () => {
        return Math.random() * 0.5 + 0.5; // Scale between 0.5 and 1
    };

    const transitionShape = (shape, targetPoint) => {
        const tween = shape.tween({ position: targetPoint }, {
            duration: 1000,
            easing: 'easeInOutQuad'
        });
        transitions.current.push(tween);
        tween.onComplete = () => {
            transitions.current = transitions.current.filter(t => t !== tween);
        };
    };

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default RandomShapes;
