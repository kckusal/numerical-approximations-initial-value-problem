// set function performComputations to execute when corresponding button is clicked in the page
document.getElementById('btn-generate-graph').addEventListener("click", performComputations);

// customize choosing of N or H value
let radios = document.getElementsByName("grids_check");
for(let i=0; i<radios.length;i++) {
  radios[i].onclick = toggleNhInput;
}
const height_input = document.getElementById("grid_height");
const num_input = document.getElementById("grid_count");

// initialize graph instances
var solutions_graph = document.getElementById('solutions_graph');
var errors_graph = document.getElementById('errors_graph');
var solutions_data = [];
var errors_data = [];

// graph layout details for Plotly
var solutions_layout = {
  title:'Approximate Solutions at various x using Numerical Methods',
  xaxis: {
    title: 'X-axis',
    range: [-1, 6]
  },
  yaxis: {
    title: 'Y-axis',
    range: [-12, 20]
  },
  height: 600
};

var errors_layout = {
  title:'Approximation Error at various x using Numerical Methods',
  xaxis: {
    title: 'x values',
    range: [-1, 6]
  },
  yaxis: {
    title: '(Global) Absolute Error'
    ,range: [-5, 20]
  },
  height: 600
};

Plotly.newPlot(solutions_graph, solutions_data, solutions_data);

Plotly.newPlot(errors_graph, errors_data, errors_layout);


// Applies Euler method in function dy/dx=f(x,y), given the initial values (xi, yi), each step height h, and number of grid steps n.
function applyEulerMethod(f, xi, yi, h, n) {
  // initialize solutions with initial values
  let solutions = {
    x: [xi],
    y: [yi]
  };

  for (let j=1; j<=n; j++) {
    yi += h*f(xi, yi);
    xi += h;

    solutions.x.push(xi);
    solutions.y.push(yi);
  }

  return solutions;
}

// Applies Improved Euler method in function dy/dx=f(x,y), given the initial values (xi, yi), each step height h, and number of grid steps n. 
function applyImprovedEulerMethod(f, xi, yi, h, n) {
  // initialize solutions with initial values
  let solutions = {
    x: [xi],
    y: [yi]
  };

  let temp=-1;
  for (let j=1; j<=n; j++) {
    temp = f(xi, yi);
    xi += h;
    yi += 0.5*h*(temp + f(xi, yi+h*temp));

    solutions.x.push(xi);
    solutions.y.push(yi);
  }
  return solutions;
}

// Apply fourth order Runge-Kutta method in function dy/dx=f(x,y), given the initial values (xi, yi), each step height h, and number of grid steps n.
// Return the approximated solution set.
function applyRungeKuttaMethod(f, xi, yi, h, n) {
  let solutions = {
    x: [xi],
    y: [yi]
  };

  let k1, k2, k3, k4;
  for (let j=1; j<=n; j++) {
    k1 = f(xi, yi);
    k2 = f(xi + 0.5*h, yi + 0.5*h*k1);
    k3 = f(xi + 0.5*h, yi + 0.5*h*k2);
    k4 = f(xi + h, yi + h*k3);

    xi += h;
    yi += (k1 + 2*k2 + 2*k3 + k4)*h/6;

    solutions.x.push(xi);
    solutions.y.push(yi);    
  }
  return solutions;
}

// get exact solutions in function y=f(x), starting from xi for various values of x at n intervals each of size h.
function getExactSolutions(f, xi, yi, h, n) {
  let solutions = {
    x: [xi],
    y: [yi]
  };

  for (let j=1; j<=n; j++) {
    xi += h;
    yi = f(xi);

    solutions.x.push(xi);
    solutions.y.push(yi);
  }
  return solutions;
}

function performComputations() {
  // This object represents our IVP problem.
  const IVP = {
    DyDx: function(x, y) {
      return (3*x*y + x*y*y);
      //Ezio return 4/(x*x) - y/x - y*y; 
    }
  };

  // get initial value of x
  IVP.x_init = Number(document.getElementById("initial_x").value) || 0;
  
  // get initial value of y
  IVP.y_init = Number(document.getElementById("initial_y").value) || 3;

  // Find integration constant value using the initial values.
  IVP.integration_constant = Math.log(1+3/IVP.y_init) + (1.5*IVP.x_init*IVP.x_init);
  //Ezio IVP.integration_constant = (1/(IVP.y_init - 2/IVP.x_init) + IVP.x_init/4)/(Math.pow(IVP.x_init, 4));  //alert(IVP.integration_constant);

  // set the interval to calculate approximations
  IVP.x_start = IVP.x_init;
  IVP.x_end = Number(document.getElementById('end_x').value) || 5.5;

  // check for vertical asymptotes and store them in IVP object
  IVP.vertical_asymptotes = [];
  let asymptote = Math.sqrt(IVP.integration_constant/1.5);
  if (!Number.isNaN(asymptote)) {
    IVP.vertical_asymptotes.push(-1*asymptote);
    IVP.vertical_asymptotes.push(asymptote);
  }

  // get either N or H and calculate the other
  let N = (!num_input.disabled) ? Number(document.getElementById("grid_count").value) : undefined;
  let H = (!height_input.disabled) ? Number(document.getElementById("grid_height").value) : undefined;

  if (N===undefined && H!==undefined) {
    N = (IVP.x_end - IVP.x_start)/H;
  } else if (N!==undefined && H===undefined) {
    H = (IVP.x_end - IVP.x_start)/N;
  }

  // the formula for exact solution found analytically
  IVP.Fx = function(x) {
    return 3/(Math.exp(-1.5*x*x + IVP.integration_constant)-1);
    //Ezio return 1/(IVP.integration_constant*x*x*x*x - x/4) + 2/x;
  };

  // get the solution values to be plotted
  let euler_solutions = applyEulerMethod(IVP.DyDx, IVP.x_init, IVP.y_init, H, N);
  let improvedEuler_solutions = applyImprovedEulerMethod(IVP.DyDx, IVP.x_init, IVP.y_init, H, N);
  let rungeKutta_solutions = applyRungeKuttaMethod(IVP.DyDx, IVP.x_init, IVP.y_init, H, N);
  let exact_solutions = getExactSolutions(IVP.Fx, IVP.x_init, IVP.y_init, H, N);

  // customize solution plotting layout
  Object.assign(euler_solutions, {
    mode: 'markers+lines',
    name: 'Euler Approximations',
    marker: {
      symbol: "cross"
    }
  });

  Object.assign(improvedEuler_solutions, {
    mode: 'markers+lines',
    name: 'Improved Euler Approximations',
    marker: {
      symbol: "square-open"
    }
  });

  Object.assign(rungeKutta_solutions, {
    mode: 'markers+lines',
    name: 'Runge-Kutta Approximations',
    marker: {
      symbol: "circle",
      size: 5,
      color: 'red'
    }
  });

  Object.assign(exact_solutions, {
    mode: 'markers+lines',
    name: 'Exact Solutions',
    marker: {
      symbol: "diamond",
      size: 3,
      color: 'green',
      opacity: 0.7
    }
  });


  // accumulate solutions data
  solutions_data = [euler_solutions, improvedEuler_solutions, rungeKutta_solutions, exact_solutions];

  // customize solution layout
  errors_layout.xaxis.range = solutions_layout.xaxis.range = [Math.min(IVP.x_start, IVP.vertical_asymptotes[0])-Math.min(0.5, H), Math.max(IVP.x_end, IVP.vertical_asymptotes[1]) + Math.min(0.5, H)];

  // including vertical asymptotes
  IVP.vertical_asymptotes.sort(function(a, b){return a - b});
  for (let i=0; i<IVP.vertical_asymptotes.length; i++) {
    if (IVP.x_start<=IVP.vertical_asymptotes[i] && IVP.x_end>=IVP.vertical_asymptotes[i]) {
      solutions_data.push({
        x: [IVP.vertical_asymptotes[i], IVP.vertical_asymptotes[i]],
        y: [-Number.MAX_VALUE, Number.MAX_VALUE],
        mode: 'lines+markers',
        name: "Vertical Asymptote at x = " + IVP.vertical_asymptotes[i].toFixed(4),
        line: {dash:'dot', width:1.2}
      });
    }    
  }

  // get errors and plot them
  let euler_errors = getAbsoluteErrors(euler_solutions, exact_solutions);
  let improverEuler_errors = getAbsoluteErrors(improvedEuler_solutions, exact_solutions);
  let rungeKutta_errors = getAbsoluteErrors(rungeKutta_solutions, exact_solutions);

  // customize error traces layout
  Object.assign(euler_errors, {
    mode: 'markers',
    name: 'Euler Approximation Error',
    marker: {
      symbol: "cross"
    }
  });

  Object.assign(improverEuler_errors, {
    mode: 'markers',
    name: 'Improved Euler Approximation Error',
    marker: {
      symbol: "square-open"
    }
  });

  Object.assign(rungeKutta_errors, {
     mode: 'markers',
    name: 'Runge-Kutta Approximation Error',
    marker: {
      symbol: "circle",
      size: 5,
      color: 'red'
    }
  });


  errors_data = [euler_errors, improverEuler_errors, rungeKutta_errors];

  // plot all the required graphs now.
  plotAll();
}

// get absolute errors by calculating (approximated value - exact value) for each x
function getAbsoluteErrors(approx_solutions, exact_solutions) {
  
  let error_data = {
    x:[], y:[]
  };
  let n = exact_solutions.x.length;

  for (let i=0; i<n; i++) {
    error_data.x.push(approx_solutions.x[i]);
    error_data.y.push(Math.abs(approx_solutions.y[i] - exact_solutions.y[i]));
  }
  return error_data;
}


// plotting function uses the Plotly library
function plotAll() {
  Plotly.react(solutions_graph, solutions_data, solutions_layout);
  Plotly.react(errors_graph, errors_data, errors_layout);
}

// lets users choose either N or H
function toggleNhInput() {
  if (radios[0].checked) {
    height_input.disabled = true;
    num_input.disabled = false;
    height_input.value = 0;
  } else if (radios[1].checked) {
    height_input.disabled = false;
    num_input.disabled = true;
    num_input.value = 0;
  }
}